export interface BlacksmithWindowContext {
	favor: number;
	costs: {
		pickaxe: number;
		reforge: number;
		harden: number;
		upgrade: number;
		smith: number;
	};
	labels: {
		title: string;
		prompt: string;
		pickaxe: string;
		reforge: string;
		harden: string;
		upgrade: string;
		smith: string;
		cashout: string;
		smithVerify: string;
		smithYes: string;
		smithNo: string;
		cashoutVerify: string;
		cashoutYes: string;
		cashoutNo: string;
	};
	showChoice: (title: string, body: string, options: readonly { label: string; disabled?: boolean; onPick: () => void }[]) => void;
	showConfirm: (title: string, body: string, yes: string, no: string, onYes: () => void) => void;
	onReforge: () => void;
	onPickaxe: () => void;
	onHarden: () => void;
	onUpgrade: () => void;
	onSmith: () => void;
	onCashout: () => void;
}

/** The service list from `WndBlacksmith`; the scene supplies state and operations. */
export function openBlacksmithWindow(context: BlacksmithWindowContext): void {
	const { favor, costs, labels } = context;
	context.showChoice(labels.title, labels.prompt, [
		{ label: labels.pickaxe, disabled: favor < costs.pickaxe, onPick: context.onPickaxe },
		{ label: labels.reforge, disabled: favor < costs.reforge, onPick: context.onReforge },
		{ label: labels.harden, disabled: favor < costs.harden, onPick: context.onHarden },
		{ label: labels.upgrade, disabled: favor < costs.upgrade, onPick: context.onUpgrade },
		{ label: labels.smith, disabled: favor < costs.smith, onPick: context.onSmith },
		{ label: labels.cashout, disabled: favor <= 0, onPick: context.onCashout },
	]);
}

/** Confirmation before consuming Blacksmith favor for Smith's generated rewards. */
export function confirmBlacksmithSmith(context: BlacksmithWindowContext): void {
	if (context.favor < context.costs.smith) return;
	context.showConfirm(
		context.labels.title,
		context.labels.smithVerify,
		context.labels.smithYes,
		context.labels.smithNo,
		context.onSmith,
	);
}

/** Confirmation before converting all remaining favor into gold. */
export function confirmBlacksmithCashout(context: BlacksmithWindowContext): void {
	if (context.favor <= 0) return;
	context.showConfirm(
		context.labels.title,
		context.labels.cashoutVerify,
		context.labels.cashoutYes,
		context.labels.cashoutNo,
		context.onCashout,
	);
}
