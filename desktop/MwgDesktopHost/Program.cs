using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace MwgDesktopHost;

/// <summary>
/// A WebView2 window around a built game directory.
///
/// The page is served through a virtual host rather than opened as a `file://` URL. That is the
/// point of the host, not a detail: a `file://` origin is opaque to WebView2, so the game's save
/// data and settings - which live in `localStorage` - would be unavailable or evicted between
/// runs, and anything the page fetches relative to itself is treated as cross-origin. Mapping a
/// host name onto the folder gives the page an ordinary https origin with a stable, writable
/// storage partition, while the folder keeps working exactly as it does in a browser.
///
/// Expects the built game in a `web` folder beside the executable (`dotnet publish` output), which
/// is what the release workflow copies `dist/` into.
/// </summary>
internal static class Program
{
	/// <summary>Any name works; it is never resolved by DNS, WebView2 intercepts it.</summary>
	private const string VirtualHost = "game.mwg.local";

	private const string WindowTitle = "Shattered Pixel Dungeon — on mwg";

	[STAThread]
	private static void Main()
	{
		ApplicationConfiguration.Initialize();

		var webRoot = Path.Combine(AppContext.BaseDirectory, "web");
		if (!File.Exists(Path.Combine(webRoot, "index.html")))
		{
			MessageBox.Show(
				$"No built game found at {webRoot}.\n\nRun `npm run build`, then copy `dist/` into a `web` folder beside this executable.",
				WindowTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
			return;
		}

		using var form = new Form
		{
			Text = WindowTitle,
			ClientSize = new Size(1280, 720),
			StartPosition = FormStartPosition.CenterScreen,
			MinimumSize = new Size(640, 480),
			KeyPreview = true,
		};
		var web = new WebView2 { Dock = DockStyle.Fill };
		form.Controls.Add(web);

		//F11 toggles maximised, the closest thing to fullscreen a plain WinForms window has
		//without a dedicated borderless mode; the game itself is canvas-drawn at any size.
		form.KeyDown += (_, key) =>
		{
			if (key.KeyCode != Keys.F11) return;
			form.WindowState = form.WindowState == FormWindowState.Maximized ? FormWindowState.Normal : FormWindowState.Maximized;
		};

		form.Load += async (_, _) =>
		{
			//A per-user data folder rather than the default beside the executable: WebView2 needs a
			//writable profile, and an installed copy under `Program Files` is not writable.
			var userData = Path.Combine(
				Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "mwg-desktop-host");
			var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: userData);
			await web.EnsureCoreWebView2Async(environment);

			var core = web.CoreWebView2;
			core.SetVirtualHostNameToFolderMapping(VirtualHost, webRoot, CoreWebView2HostResourceAccessKind.Allow);
			core.Settings.AreDefaultContextMenusEnabled = false;
			core.Settings.IsStatusBarEnabled = false;
			core.Settings.AreBrowserAcceleratorKeysEnabled = false;
#if DEBUG
			core.Settings.AreDevToolsEnabled = true;
#else
			core.Settings.AreDevToolsEnabled = false;
#endif
			core.Navigate($"https://{VirtualHost}/index.html");
		};

		Application.Run(form);
	}
}
