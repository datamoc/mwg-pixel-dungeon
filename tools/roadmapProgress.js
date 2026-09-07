// Small MWG-based visualizer for this project's own ROADMAP.md: one Bar per `##` section,
// filled by the fraction of `- [x]` checkboxes it contains, plus an overall bar at the top.
// Uses mwg's real two-d.Game/Scene2D lifecycle and ui.Bar/ui.Label widgets (loaded from the
// standalone global build, see roadmap-progress.html) rather than hand-rolled canvas drawing.
'use strict';

/** Parses ROADMAP.md's own checkbox convention (`- [ ]` / `- [x]`, one per line, grouped
 *  under `## ` section headers) into per-section and overall totals. */
function parseRoadmap(markdown) {
	// ROADMAP.md has CRLF line endings; JS regex `.` does not match `\r`, so a trailing `\r`
	// left on each line after split('\n') silently breaks every `$`-anchored match below.
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const sections = [];
	let current = null;
	let overallDone = 0;
	let overallTotal = 0;

	for (const line of lines) {
		const heading = line.match(/^##\s+(.+)$/);
		if (heading) {
			current = { name: heading[1].trim(), done: 0, total: 0 };
			sections.push(current);
			continue;
		}
		const checkbox = line.match(/^\s*-\s\[([ xX])\]/);
		if (checkbox) {
			const done = checkbox[1].toLowerCase() === 'x';
			overallTotal++;
			if (done) overallDone++;
			if (current) {
				current.total++;
				if (done) current.done++;
			}
		}
	}

	return { sections: sections.filter((s) => s.total > 0), overallDone, overallTotal };
}

class RoadmapScene extends mw_games.Scene2D {
	create() {
		const { sections, overallDone, overallTotal } = window.__roadmapData;
		const barWidth = 420;
		const rowHeight = 34;
		const left = 24;
		let y = 20;

		const title = new mw_games.Label({ text: 'mwg-pixel-dungeon — ROADMAP.md progress', size: 20, bold: true, color: 0xffffff });
		title.position.set(left, y);
		this.stage.addChild(title);
		y += 40;

		const overallPct = overallTotal > 0 ? Math.round((100 * overallDone) / overallTotal) : 0;
		const overallLabel = new mw_games.Label({ text: `Overall: ${overallDone}/${overallTotal} (${overallPct}%)`, size: 16, bold: true, color: 0xffd166 });
		overallLabel.position.set(left, y);
		this.stage.addChild(overallLabel);
		y += 24;

		const overallBar = new mw_games.Bar({ width: barWidth, height: 18, color: 0xffd166, value: overallDone, max: Math.max(1, overallTotal) });
		overallBar.position.set(left, y);
		this.stage.addChild(overallBar);
		y += 40;

		for (const section of sections) {
			const label = new mw_games.Label({ text: `${section.name}  (${section.done}/${section.total})`, size: 13, color: 0xdddddd });
			label.position.set(left, y);
			this.stage.addChild(label);
			y += 18;

			const bar = new mw_games.Bar({ width: barWidth, height: 12, value: section.done, max: section.total });
			bar.position.set(left, y);
			this.stage.addChild(bar);
			y += rowHeight - 18;
		}
	}
}

(async () => {
	const response = await fetch('../ROADMAP.md');
	const markdown = await response.text();
	window.__roadmapData = parseRoadmap(markdown);

	const game = new mw_games.Game({ background: 0x14161c, resizeTo: window });
	await game.start(RoadmapScene);
})();
