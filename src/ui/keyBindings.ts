import { Input, Settings } from 'mwg';
import { has, t, titleCase } from '../i18n/index';

// SPD's SPDAction stores integer GameAction codes for three keyboard slots and three
// controller slots (SPDAction.java, tag v3.3.8). This browser port uses MWG's physical
// KeyboardEvent.code and Gamepad pseudo-code strings; Settings persists the active
// binding arrays plus separate three-slot keyboard/controller layouts.
const settings = new Settings({ namespace: 'mwg-pixel-dungeon-controls' });
let defaults: Record<string, string[]> = {};
type SlotMap = Record<string, (string | null)[]>;
let slots: SlotMap = {};
const SLOT_SETTING = 'keyboardBindingSlots';
const CONTROLLER_SLOT_SETTING = 'controllerBindingSlots';

const LABEL_KEYS: Record<string, string> = {
	up: 'n', down: 's', left: 'w', right: 'e',
	upLeft: 'nw', upRight: 'ne', downLeft: 'sw', downRight: 'se',
	search: 'examine', special: 'tag_action',
};

/** Snapshot this game's own bindings before restoring any saved player overrides. */
export function initializeKeyBindings(): void {
	defaults = Input.exportBindings();
	const stored = parseSlots(settings.getCustom(SLOT_SETTING, ''));
	const storedController = parseSlots(settings.getCustom(CONTROLLER_SLOT_SETTING, ''));
	slots = {};
	for (const action of Object.keys(defaults)) {
		const fallback = (settings.current.bindings[action] ?? defaults[action]!).filter((key) => !key.startsWith('Gamepad'));
		slots[action] = stored?.[action] ?? toThreeSlots(fallback);
	}
	controllerSlots = {};
	for (const action of Object.keys(defaults)) controllerSlots[action] = storedController?.[action] ?? toThreeSlots(CONTROLLER_DEFAULTS[action] ?? []);
	applySlots();
}

// SPDAction's v3.3.8 controller map uses the standard gamepad layout. This port
// maps its available actions and movement to the corresponding browser Gamepad indices.
const CONTROLLER_DEFAULTS: Record<string, string[]> = {
	cancel: ['Gamepad0Button9'], confirm: ['Gamepad0Button0'],
	up: ['Gamepad0Button12', 'Gamepad0Axis1-'], down: ['Gamepad0Button13', 'Gamepad0Axis1+'],
	left: ['Gamepad0Button14', 'Gamepad0Axis0-'], right: ['Gamepad0Button15', 'Gamepad0Axis0+'],
	examine: ['Gamepad0Button1'], zoomIn: ['Gamepad0Button5'], zoomOut: ['Gamepad0Button4'],
};
let controllerSlots: SlotMap = {};

export function restoreDefaultKeyBindings(): void {
	if (Object.keys(defaults).length === 0) return;
	slots = Object.fromEntries(Object.entries(defaults).map(([action, keys]) => [action, toThreeSlots(keys)]));
	controllerSlots = Object.fromEntries(Object.keys(defaults).map((action) => [action, toThreeSlots(CONTROLLER_DEFAULTS[action] ?? [])]));
	applySlots();
}

export function persistKeyBindings(): void {
	settings.setBindings(Input.exportBindings());
	settings.setCustom(SLOT_SETTING, JSON.stringify(slots));
	settings.setCustom(CONTROLLER_SLOT_SETTING, JSON.stringify(controllerSlots));
}

export function keyBindingSlotsSnapshot(): SlotMap {
	return cloneSlots(slots);
}

export function restoreKeyBindingSlots(snapshot: SlotMap): void {
	slots = cloneSlots(snapshot);
	applySlots();
}

export function controllerBindingSlotsSnapshot(): SlotMap { return cloneSlots(controllerSlots); }
export function restoreControllerBindingSlots(snapshot: SlotMap): void { controllerSlots = cloneSlots(snapshot); applySlots(); }
export function keysForControllerSlotAction(action: string): (string | null)[] { return [...(controllerSlots[action] ?? [null, null, null])]; }
export function setControllerBindingSlot(action: string, slot: number, key: string): boolean {
	return setSlot(controllerSlots, action, slot, key);
}
export function clearControllerBindingSlot(action: string, slot: number): boolean {
	return clearSlot(controllerSlots, action, slot);
}

export function keyBindingActions(): string[] {
	return Object.keys(defaults);
}

export function keysForSlotAction(action: string): (string | null)[] {
	return [...(slots[action] ?? [null, null, null])];
}

/** Replaces one SPD keyboard slot and preserves Java's one-binding-minimum/collision rules. */
export function setKeyBindingSlot(action: string, slot: number, key: string): boolean {
	return setSlot(slots, action, slot, key);
}

function setSlot(map: SlotMap, action: string, slot: number, key: string): boolean {
	const own = map[action];
	if (!own || slot < 0 || slot > 2 || !key) return false;
	const previousOwners = Input.actionsForKey(key).filter((other) => other !== action);
	if (previousOwners.some((other) => [...(slots[other] ?? []), ...(controllerSlots[other] ?? [])].filter(Boolean).length <= 1)) return false;
	if (own.some((value, index) => value === key && index !== slot)) return false;
	for (const other of previousOwners) {
		for (const otherMap of [slots, controllerSlots]) {
			const otherSlots = otherMap[other];
			if (otherSlots) otherMap[other] = otherSlots.map((value) => value === key ? null : value);
		}
	}
	own[slot] = key;
	applySlots();
	return true;
}

/** Java refuses to unbind the last key from an action. */
export function clearKeyBindingSlot(action: string, slot: number): boolean {
	return clearSlot(slots, action, slot);
}
function clearSlot(map: SlotMap, action: string, slot: number): boolean {
	const own = map[action];
	if (!own || slot < 0 || slot > 2 || own[slot] === null) return false;
	if ([...(slots[action] ?? []), ...(controllerSlots[action] ?? [])].filter(Boolean).length <= 1) return false;
	own[slot] = null;
	applySlots();
	return true;
}

function applySlots(): void {
	const bindings = { ...defaults };
	for (const [action, actionSlots] of Object.entries(slots)) {
		bindings[action] = [...actionSlots, ...(controllerSlots[action] ?? [])].filter((key): key is string => key !== null);
	}
	Input.importBindings(bindings);
}

function toThreeSlots(keys: readonly string[]): (string | null)[] {
	return [keys[0] ?? null, keys[1] ?? null, keys[2] ?? null];
}

function cloneSlots(value: SlotMap): SlotMap {
	return Object.fromEntries(Object.entries(value).map(([action, actionSlots]) => [action, [...actionSlots]]));
}

function parseSlots(value: string | number | boolean): SlotMap | null {
	if (typeof value !== 'string') return null;
	try {
		const parsed: unknown = JSON.parse(value);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
		const result: SlotMap = {};
		for (const [action, actionSlots] of Object.entries(parsed)) {
			if (!Array.isArray(actionSlots) || actionSlots.length !== 3) return null;
			if (!actionSlots.every((key) => key === null || typeof key === 'string')) return null;
			result[action] = [...actionSlots] as (string | null)[];
		}
		return result;
	} catch {
		return null;
	}
}

export function keyBindingLabel(action: string): string {
	const key = `windows.wndkeybindings.${LABEL_KEYS[action] ?? action}`;
	return has(key) ? t(key) : titleCase(action.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' '));
}
