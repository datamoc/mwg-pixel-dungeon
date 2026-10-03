/*
 * Pixel Dungeon
 * Copyright (C) 2012-2015 Oleg Dolya
 *
 * Shattered Pixel Dungeon
 * Copyright (C) 2014-2023 Evan Debenham
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>
 */

package com.shatteredpixel.shatteredpixeldungeon.browser;

import com.badlogic.gdx.Files;
import com.github.xpenatan.gdx.teavm.backends.web.WebApplication;
import com.github.xpenatan.gdx.teavm.backends.web.WebApplicationConfiguration;
import com.shatteredpixel.shatteredpixeldungeon.ShatteredPixelDungeon;
import com.shatteredpixel.shatteredpixeldungeon.services.news.News;
import com.shatteredpixel.shatteredpixeldungeon.services.news.NewsImpl;
import com.shatteredpixel.shatteredpixeldungeon.services.updates.UpdateImpl;
import com.shatteredpixel.shatteredpixeldungeon.services.updates.Updates;
import com.watabou.noosa.Game;
import com.watabou.utils.FileUtils;

public class BrowserLauncher {

	public static void main (String[] args) {

		Game.version = BrowserBuildInfo.VERSION_NAME;
		Game.versionCode = BrowserBuildInfo.VERSION_CODE;

		if (UpdateImpl.supportsUpdates()){
			Updates.service = UpdateImpl.getUpdateService();
		}
		if (NewsImpl.supportsNews()){
			News.service = NewsImpl.getNewsService();
		}

		//gdx-teavm's local storage is backed by the browser, there is no base path to speak of
		FileUtils.setDefaultFileProperties( Files.FileType.Local, "" );

		WebApplicationConfiguration config = new WebApplicationConfiguration();
		config.canvasID = "canvas";
		//the game picks its pixel-art zoom from libGDX's density, which doesn't account for the
		//device pixel ratio, so rendering in CSS pixels is what keeps the zoom sane on hidpi
		config.usePhysicalPixels = false;
		config.showDownloadLogs = false;
		//saves and settings are namespaced so they can't collide with other games on the same host
		config.storagePrefix = "shatteredpixeldungeon/";
		config.localStoragePrefix = "shatteredpixeldungeon/";

		new WebApplication(new ShatteredPixelDungeon(new BrowserPlatformSupport()), config);
	}
}
