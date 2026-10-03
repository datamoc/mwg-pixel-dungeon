const fs=require('fs');
function rep(p,a,b){let s=fs.readFileSync(p,'utf8');if(s.includes('\r\n')){a=a.replace(/\n/g,'\r\n');b=b.replace(/\n/g,'\r\n');}const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw new Error(p+': '+a);s=s.slice(0,i)+b+s.slice(i+a.length);fs.writeFileSync(p,s);}
rep('src/ui/inventoryDock.ts',"		const coin = new Sprite(this.frameTexture(18 + 0));\n		coin.visible = false;\n		this.art.addChild(coin);\n","");
rep('src/ui/inventoryWindow.ts',"	sourceClass?: string;\n	/** `Item.AC_DROP`","	sourceClass?: string;\n	/** `ItemSlot.extra`: the strength requirement (`:10`) and its colour, shown by the docked pane. */\n	extra?: string;\n	extraColor?: number;\n	/** `Item.AC_DROP`");
