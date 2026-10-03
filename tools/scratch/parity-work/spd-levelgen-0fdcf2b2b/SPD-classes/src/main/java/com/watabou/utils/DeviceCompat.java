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

package com.watabou.utils;

import com.badlogic.gdx.Application;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.utils.SharedLibraryLoader;
import com.watabou.noosa.Game;

//TODO migrate to platformSupport class
public class DeviceCompat {
	
	public static boolean supportsFullScreen(){
		switch (Gdx.app.getType()){
			case Android:
				//Android 4.4+ supports hiding UI via immersive mode
				return Gdx.app.getVersion() >= 19;
			case iOS:
				//iOS supports hiding UI via drawing into the gesture safe area
				return Gdx.graphics.getSafeInsetBottom() != 0;
			default:
				//TODO implement functionality for other platforms here
				return true;
		}
	}

	//note that these ask libGDX rather than SharedLibraryLoader, as the browser backend
	//emulates SharedLibraryLoader and its platform fields aren't available there
	public static boolean isAndroid(){
		return Gdx.app.getType() == Application.ApplicationType.Android;
	}

	public static boolean isiOS(){
		return Gdx.app.getType() == Application.ApplicationType.iOS;
	}

	public static boolean isDesktop(){
		//SPDSettings is queried while DesktopLauncher is still constructing the
		//Lwjgl3Application, before LibGDX has assigned Gdx.app. Keep the standard
		//platform fallback for that startup window; use the application type once
		//the backend is initialized so the browser backend remains distinguishable.
		return Gdx.app != null
				? Gdx.app.getType() == Application.ApplicationType.Desktop
				: SharedLibraryLoader.isWindows || SharedLibraryLoader.isMac || SharedLibraryLoader.isLinux;
	}

	public static boolean isBrowser(){
		return Gdx.app.getType() == Application.ApplicationType.WebGL;
	}

	public static boolean hasHardKeyboard(){
		return Gdx.input.isPeripheralAvailable(Input.Peripheral.HardwareKeyboard);
	}
	
	public static boolean isDebug(){
		return Game.version.contains("INDEV");
	}
	
	public static void log( String tag, String message ){
		Gdx.app.log( tag, message );
	}

	public static RectF getSafeInsets(){
		RectF result = new RectF();
		result.left =   Gdx.graphics.getSafeInsetLeft();
		result.top =    Gdx.graphics.getSafeInsetTop();
		result.right =  Gdx.graphics.getSafeInsetRight();
		result.bottom = Gdx.graphics.getSafeInsetBottom();
		return result;
	}

}
