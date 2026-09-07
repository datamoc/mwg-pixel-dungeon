declare module '*.png' {
	const url: string;
	export default url;
}

declare module '*.jpg' {
	const url: string;
	export default url;
}

declare module '*.ttf' {
	const url: string;
	export default url;
}

/** Vite's eager asset map, declared locally because this project does not include vite/client. */
interface ImportMeta {
	glob(pattern: string, options: { eager: true; query: string; import: string }): Record<string, unknown>;
}

/** injected by vite.config.ts's `define`, from package.json's own `version` field */
declare const __APP_VERSION__: string;
