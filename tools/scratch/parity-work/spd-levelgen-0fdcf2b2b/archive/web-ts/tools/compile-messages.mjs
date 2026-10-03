/**
 * Compiles java .properties files into a plain JS object at build time.
 *
 * The Java game reads these through libGDX's I18NBundle. Doing the same parsing in the
 * browser would mean shipping the raw files and decoding them on startup; compiling them
 * here means `Messages.get()` can be an ordinary synchronous map lookup, exactly as it
 * behaves on the other platforms.
 */

/**
 * Parses one .properties file.
 *
 * Handles what this game's files actually use: comments, `=` and `:` separators, escaped
 * characters, backslash line continuations, and \\uXXXX escapes.
 */
export function parseProperties(text) {
	const out = {};

	//normalise line endings, then join continuation lines before parsing
	const lines = text.replace(/\r\n?/g, '\n').split('\n');
	const logical = [];
	let pending = null;

	for (const line of lines) {
		const current = pending === null ? line : pending + line.replace(/^\s+/, '');

		//a line continues when it ends with an odd number of backslashes
		const trailing = current.length - current.replace(/\\+$/, '').length;
		if (trailing % 2 === 1) {
			pending = current.slice(0, -1);
		} else {
			logical.push(current);
			pending = null;
		}
	}
	if (pending !== null) logical.push(pending);

	for (const line of logical) {
		const trimmed = line.replace(/^\s+/, '');
		if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;

		//the separator is the first unescaped = or :
		let i = 0;
		let sep = -1;
		while (i < trimmed.length) {
			const c = trimmed[i];
			if (c === '\\') {
				i += 2;
				continue;
			}
			if (c === '=' || c === ':') {
				sep = i;
				break;
			}
			i++;
		}
		if (sep === -1) continue;

		const key = unescape(trimmed.slice(0, sep).trim());
		const value = unescape(trimmed.slice(sep + 1).replace(/^\s+/, ''));
		out[key] = value;
	}

	return out;
}

function unescape(s) {
	let out = '';
	for (let i = 0; i < s.length; i++) {
		if (s[i] !== '\\') {
			out += s[i];
			continue;
		}
		const next = s[++i];
		switch (next) {
			case 'n': out += '\n'; break;
			case 't': out += '\t'; break;
			case 'r': out += '\r'; break;
			case 'f': out += '\f'; break;
			case 'u':
				out += String.fromCharCode(parseInt(s.slice(i + 1, i + 5), 16));
				i += 4;
				break;
			default: out += next ?? '';
		}
	}
	return out;
}

/** derives the locale suffix from a file name: actors_fr.properties -> "fr" */
export function localeOf(fileName) {
	const match = /_([a-z]{2}(?:_[A-Z]{2})?)\.properties$/.exec(fileName);
	return match ? match[1] : 'en';
}
