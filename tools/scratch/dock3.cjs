const fs=require('fs');
function rep(p,a,b){let s=fs.readFileSync(p,'utf8');if(s.includes('\r\n')){a=a.replace(/\n/g,'\r\n');b=b.replace(/\n/g,'\r\n');}const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw new Error(p+': '+a);s=s.slice(0,i)+b+s.slice(i+a.length);fs.writeFileSync(p,s);}
// dock: shown flag
rep('src/ui/inventoryDock.ts',"	private paneHeight = 82;\n","	private paneHeight = 82;\n	/** `GameScene.toggleInvPane()`: the toolbar's backpack button shows and hides the docked pane. */\n	shown = true;\n");
// E scene field
rep('src/scenes/dungeonScene.ts',"	inventoryOpen = false;","	inventoryOpen = false; inventoryDock!: import('../ui/inventoryDock').InventoryDock;");
// D panelsSingleUse
const ps='src/scenes/dungeon/panelsSingleUse.ts';
rep(ps,"				if (action === 'inventory') {\n					this.inventoryOpen = !this.inventoryOpen;\n					this.refreshInventoryPanel();","				if (action === 'inventory') {\n					//`Toolbar.btnInventory`: with the docked pane the button toggles the pane, else it opens the bag.\n					if (inventoryDocked(this.interfaceSize, uiMode(), Game.current.width, Game.current.height)) this.inventoryDock.shown = !this.inventoryDock.shown;\n					else this.inventoryOpen = !this.inventoryOpen;\n					this.refreshInventoryPanel();\n					this.positionInterface(Game.current.width, Game.current.height);");
rep(ps,"		this.inventoryPanel = new InventoryWindow(","		this.inventoryDock = new InventoryDock((entry) => { this.inventoryOpen = true; this.refreshInventoryPanel(); this.inventoryPanel.inspect(entry); });\n		this.inventoryDock.visible = false;\n		this.stage.addChild(this.inventoryDock);\n		this.inventoryPanel = new InventoryWindow(");
rep(ps,"import { InventoryWindow } from '../../ui/inventoryWindow';","import { InventoryWindow } from '../../ui/inventoryWindow';\nimport { InventoryDock } from '../../ui/inventoryDock';\nimport { inventoryDocked } from '../../ui/interfaceMode';\nimport { uiMode } from '../../settings';");
// C context
const q='src/scenes/dungeon/hero/inventoryQuickslot.ts';
rep(q,"		const context: InventoryPanelContext = {\n			panel: this.inventoryPanel,","		const docked = inventoryDocked(this.interfaceSize, uiMode(), Game.current.width, Game.current.height);\n		this.inventoryDock.visible = docked && this.inventoryDock.shown;\n		const context: InventoryPanelContext = {\n			panel: this.inventoryPanel,\n			dock: docked ? this.inventoryDock : null,\n			weaponLevel: this.weaponLevel, weaponStrReq: weaponSTRReq(this.weaponTier, this.weaponLevel),\n			armorStrReq: armorSTRReq(this.armorTier, this.armorLevel), heroStr: this.hero.str ?? 0,");
rep(q,"import { Actors, Blob, Camera, Game,","import { inventoryDocked } from '../../../ui/interfaceMode';\nimport { uiMode } from '../../../settings';\nimport { armorSTRReq, weaponSTRReq } from '../../../items/strReq';\nimport { Actors, Blob, Camera, Game,");
// F positionInterface
const g='src/scenes/dungeon/hero/weaponSpellsGear.ts';
rep(g,"			const inset = this.interfaceSize === 1 ? 0 : 8;","			const large = effectiveInterfaceSize(this.interfaceSize, width, height) === 1;\n			this.gameLog.setInterfaceSize(large ? 1 : 0);\n			const inset = large ? 0 : 8;");
rep(g,"		if (this.actionBar) {\n			this.actionBar.layout(width, height);","		//The docked inventory pane owns the bottom-right corner; the toolbar sits on top of it (`GameScene`: `toolbar.setRect(0, height - toolbar.height() - inventory.height(), ..)`).\n		const dockInset = this.inventoryDock?.visible ? this.inventoryDock.renderedHeight : 0;\n		if (this.inventoryDock) this.inventoryDock.position.set(width - this.inventoryDock.renderedWidth, height - this.inventoryDock.renderedHeight);\n		if (this.actionBar) {\n			this.actionBar.layout(width, height - dockInset);");
rep(g,"const toolbarTop = height - this.actionBar.occupiedHeight","const toolbarTop = height - dockInset - this.actionBar.occupiedHeight");
rep(g,"import { Game, Random, Roguelike } from 'mwg';","import { Game, Random, Roguelike } from 'mwg';\nimport { effectiveInterfaceSize } from '../../../ui/interfaceMode';");
