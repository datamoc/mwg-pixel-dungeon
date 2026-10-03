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

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Pixmap;
import com.badlogic.gdx.graphics.g2d.PixmapPacker;
import com.badlogic.gdx.graphics.g2d.freetype.FreeTypeFontGenerator;
import com.watabou.utils.PlatformSupport;

import java.util.ArrayList;
import java.util.HashMap;

public class BrowserPlatformSupport extends PlatformSupport {

	@Override
	public void updateDisplaySize() {
		//the canvas is sized by the page, there is no window size to remember
	}

	@Override
	public void updateSystemUI() {
		//fullscreen is handled by the browser itself
	}

	@Override
	public boolean connectedToUnmeteredNetwork() {
		//no reliable way to check this from a browser, and the game does no downloading here
		return true;
	}

	@Override
	public void vibrate(int millis) {
		//not every browser exposes the vibration API, and vibration is purely cosmetic
		try {
			Gdx.input.vibrate(millis);
		} catch (Exception e) {
			//ignore
		}
	}

	/* FONT SUPPORT */

	//custom pixel font, for use with Latin and Cyrillic languages
	private static FreeTypeFontGenerator basicFontGenerator;
	//droid sans fallback, for asian fonts
	private static FreeTypeFontGenerator asianFontGenerator;

	@Override
	public void setupFontGenerators(int pageSize, boolean systemfont) {
		//don't bother doing anything if nothing has changed
		if (fonts != null && this.pageSize == pageSize && this.systemfont == systemfont){
			return;
		}
		this.pageSize = pageSize;
		this.systemfont = systemfont;

		resetGenerators(false);
		fonts = new HashMap<>();

		if (systemfont) {
			basicFontGenerator = asianFontGenerator = new FreeTypeFontGenerator(Gdx.files.internal("fonts/droid_sans.ttf"));
		} else {
			basicFontGenerator = new FreeTypeFontGenerator(Gdx.files.internal("fonts/pixel_font.ttf"));
			asianFontGenerator = new FreeTypeFontGenerator(Gdx.files.internal("fonts/droid_sans.ttf"));
		}

		fonts.put(basicFontGenerator, new HashMap<>());
		fonts.put(asianFontGenerator, new HashMap<>());

		packer = new PixmapPacker(pageSize, pageSize, Pixmap.Format.RGBA8888, 1, false);
	}

	//TeaVM's regex support doesn't include unicode block classes (\p{InHiragana} and friends),
	//so the character tests the other platforms do with regexes are done by codepoint here

	//CJK symbols and punctuation, hiragana, katakana, CJK unified ideographs,
	//hangul syllables, and halfwidth/fullwidth forms
	private static boolean isAsianChar( char c ){
		return (c >= '　' && c <= '〿')
			|| (c >= '぀' && c <= 'ゟ')
			|| (c >= '゠' && c <= 'ヿ')
			|| (c >= '一' && c <= '鿿')
			|| (c >= '가' && c <= '힯')
			|| (c >= '＀' && c <= '￯');
	}

	//the characters text is split around, mirroring the regexes the other platforms use
	private static boolean isSplitChar( char c, boolean multiline ){
		if (c == '\n' || c == '_') return true;
		if (multiline && c == ' ') return true;
		return (c >= '　' && c <= '〿')
			|| (c >= '぀' && c <= 'ゟ')
			|| (c >= '゠' && c <= 'ヿ')
			|| (c >= '一' && c <= '鿿');
	}

	@Override
	protected FreeTypeFontGenerator getGeneratorForString( String input ){
		for (int i = 0; i < input.length(); i++){
			if (isAsianChar(input.charAt(i))){
				return asianFontGenerator;
			}
		}
		return basicFontGenerator;
	}

	@Override
	public String[] splitforTextBlock(String text, boolean multiline) {
		ArrayList<String> result = new ArrayList<>();
		int start = 0;
		for (int i = 1; i < text.length(); i++) {
			//split on both sides of every splitting character, exactly as the regexes do
			if (isSplitChar(text.charAt(i - 1), multiline) || isSplitChar(text.charAt(i), multiline)) {
				result.add(text.substring(start, i));
				start = i;
			}
		}
		if (start < text.length()) {
			result.add(text.substring(start));
		}
		return result.toArray(new String[0]);
	}
}
