// Scaling scenarios: each one grows a single input shape so superlinear parsing shows up as a rising cost per unit
export interface ScalingScenario {
	name: string;
	// Builds an input made of `size` units (tags, or characters for the tagless shapes)
	build: (size: number) => string;
	// Input sizes to measure, smallest first
	sizes?: number[];
	// Why this scenario is allowed to grow faster than linearly; it is reported but never fails the run
	knownSuperlinear?: string;
}

export interface ScalingPoint {
	size: number;
	// Best observed time for one parse, undefined when the run was skipped or threw
	ms?: number;
	note?: string;
}

const defaultSizes = [1000, 10000, 100000];

export const scalingScenarios: ScalingScenario[] = [
	{ name: 'Flat pairs', build: size => '[b]x[/b]'.repeat(size / 2) },
	{ name: 'List items', build: size => `[list]${'[*] item\n'.repeat(size)}[/list]` },
	{ name: 'Images', build: size => '[img]https://example.com/a.png[/img]'.repeat(size / 2) },
	{ name: 'Unknown tags', build: size => '[foo]x[/foo]'.repeat(size / 2) },
	{ name: 'Mixed-case names', build: size => '[B]x[/b][QuOtE=a]y[/QUOTE]'.repeat(size / 4) },
	{ name: 'Nested depth', build: size => `${'[b]'.repeat(size / 2)}x${'[/b]'.repeat(size / 2)}` },
	{ name: 'Unclosed + stray closers', build: size => '[b]'.repeat(size / 2) + '[/i]'.repeat(size / 2) },
	{ name: 'Unclosed list items', build: size => '[*]'.repeat(size) },
	{ name: 'Crossed pairs', build: size => '[b][i]x[/b][/i]'.repeat(size / 4) },
	{ name: 'Open brackets', build: size => '['.repeat(size) },
	{ name: 'Open brackets, then a caret', build: size => `${'['.repeat(size)}^]` },
	{ name: 'Carets in brackets', build: size => `${'[^'.repeat(size / 2)}]` },
	{ name: 'Plain text', build: size => 'lorem ipsum dolor sit amet '.repeat(size / 27) },
	{ name: 'Text with newlines', build: size => 'lorem ipsum\r\ndolor sit amet\n'.repeat(size / 28) },
	{ name: 'HTML to escape', build: size => '<a href="x">Tom & Jerry\'s</a> '.repeat(size / 30) },
	{
		name: 'Nested images',
		build: size => `${'[img]'.repeat(size / 2)}x${'[/img]'.repeat(size / 2)}`,
		sizes: [200, 2000],
		knownSuperlinear: 'every [img] escapes all the output nested inside it',
	},
];

// A parse slower than this is not repeated, and larger sizes of the same scenario are skipped
const slowParseMs = 1500;
const sampleBudgetMs = 150;
const maxSamples = 20;

export function measureScaling(parse: (input: string) => void, scenario: ScalingScenario): ScalingPoint[] {
	const points: ScalingPoint[] = [];
	let tooSlow = false;
	for (const size of scenario.sizes ?? defaultSizes) {
		if (tooSlow) {
			points.push({ size, note: 'skipped' });
			continue;
		}
		const input = scenario.build(size);
		let best = Infinity;
		let spent = 0;
		try {
			for (let sample = 0; sample < maxSamples && spent < sampleBudgetMs; sample++) {
				const start = performance.now();
				parse(input);
				const elapsed = performance.now() - start;
				spent += elapsed;
				best = Math.min(best, elapsed);
			}
		} catch (error) {
			points.push({ size, note: `threw ${error instanceof Error ? error.name : 'error'}` });
			tooSlow = true;
			continue;
		}
		points.push({ size, ms: best });
		tooSlow = best > slowParseMs;
	}
	return points;
}

/**
 * How much the cost per unit grew from the smallest to the largest size: about 1 for linear parsing,
 * and about the size ratio (100 by default) for quadratic. Returns undefined when the largest size never finished.
 */
export function scalingGrowth(points: ScalingPoint[]): number | undefined {
	const first = points[0];
	const last = points.at(-1);
	if (first?.ms === undefined || last?.ms === undefined || first.ms === 0) {
		return undefined;
	}
	return (last.ms / last.size) / (first.ms / first.size);
}
