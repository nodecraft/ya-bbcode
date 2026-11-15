import { appendFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import bbobHtml from '@bbob/html';
import { parse as bbobParse } from '@bbob/parser';
import presetHtml5 from '@bbob/preset-html5';
import { Bench } from 'tinybench';
import xbbcode from 'xbbcode-parser';

import yabbcode from '../dist/ya-bbcode.mjs';
import { measureScaling, scalingGrowth, scalingScenarios } from './scaling.ts';
import { benchCases } from './test-cases.ts';

import type { ScalingPoint } from './scaling.ts';
import type { BenchCase } from './test-cases.ts';

type Parser = typeof yabbcode;

interface Contender {
	name: string;
	run: (input: string) => unknown;
}

interface BenchResult {
	name: string;
	opsPerSec: number;
	meanMs: number;
	margin: number;
}

interface CaseReport {
	name: string;
	inputLength: number;
	results: BenchResult[];
}

interface ScalingReport {
	scenario: string;
	parser: string;
	points: ScalingPoint[];
	growth: number | undefined;
}

const current = 'ya-bbcode';
const baselineName = 'ya-bbcode (baseline)';
// Every ya-bbcode row: their output is checked, and they are left out of the cross-library ranking
const ours = new Set([current, 'ya-bbcode (new instance)', baselineName]);
// Cost per unit may grow this much between the smallest and largest scaling size before the run fails; quadratic parsing lands near 100
const maxScalingGrowth = 10;

const { values: options } = parseArgs({
	options: {
		// Path to another ya-bbcode build (e.g. a copy of dist/ya-bbcode.mjs from main) to measure alongside this one
		'baseline': { type: 'string' },
		// Only run cases whose name contains this text
		'filter': { type: 'string' },
		// Milliseconds to spend measuring each row
		'time': { type: 'string', default: '500' },
		// Write every measurement to this file as JSON
		'json': { type: 'string' },
		'skip-scaling': { type: 'boolean', default: false },
	},
});

const chTag = { type: 'replace', open: '<div>', close: '</div>' } as const;
const html5 = presetHtml5();
const chPreset = presetHtml5.extend((tags) => {
	return {
		...tags,
		ch: (node) => {
			return { tag: 'div', attrs: {}, content: node.content ?? [] };
		},
	};
})();
xbbcode.addTags({
	ch: {
		openTag: () => '<div>',
		closeTag: () => '</div>',
		restrictChildrenTo: [],
	},
});

function createParser(Parser: Parser, benchCase: BenchCase): InstanceType<Parser> {
	const parser = new Parser() as InstanceType<Parser>;
	if (benchCase.chOnly) {
		parser.registerTag('ch', chTag);
	}
	return parser;
}

function buildContenders(benchCase: BenchCase, Baseline: Parser | undefined): Contender[] {
	const parser = createParser(yabbcode, benchCase);
	const contenders: Contender[] = [
		{ name: current, run: input => parser.parse(input) },
		{ name: 'ya-bbcode (new instance)', run: input => createParser(yabbcode, benchCase).parse(input) },
	];
	if (Baseline) {
		const baseline = createParser(Baseline, benchCase);
		contenders.push({ name: baselineName, run: input => baseline.parse(input) });
	}
	if (benchCase.chOnly) {
		contenders.push(
			{ name: '@bbob/html', run: input => bbobHtml(input, chPreset, { onlyAllowTags: ['ch'] }) },
			{ name: '@bbob/parser (no render)', run: input => bbobParse(input, { onlyAllowTags: ['ch'] }) },
		);
	} else {
		contenders.push(
			{ name: '@bbob/html', run: input => bbobHtml(input, html5) },
			{ name: '@bbob/parser (no render)', run: input => bbobParse(input) },
		);
	}
	contenders.push({
		name: 'xbbcode-parser',
		run: input => xbbcode.process({ text: input, removeMisalignedTags: false, addInLineBreaks: false }).html,
	});
	return contenders;
}

function formatNumber(value: number): string {
	return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatTime(ms: number): string {
	if (ms >= 1000) {
		return `${(ms / 1000).toFixed(2)} s`;
	}
	if (ms >= 1) {
		return `${ms.toFixed(2)} ms`;
	}
	if (ms >= 0.001) {
		return `${(ms * 1000).toFixed(2)} µs`;
	}
	return `${(ms * 1_000_000).toFixed(0)} ns`;
}

function formatRatio(ratio: number): string {
	if (ratio >= 1) {
		return `${ratio.toFixed(2)}x faster`;
	}
	return `${(1 / ratio).toFixed(2)}x slower`;
}

// A fast parser that returns the wrong HTML has not won anything, so output is checked before any timing
function findOutputProblems(benchCase: BenchCase, contenders: Contender[]): string[] {
	const problems: string[] = [];
	for (const contender of contenders) {
		if (!ours.has(contender.name)) {
			continue;
		}
		let output: unknown;
		try {
			output = contender.run(benchCase.input);
		} catch (error) {
			output = `threw ${String(error)}`;
		}
		if (output === benchCase.expected) {
			continue;
		}
		const text = String(output);
		let at = 0;
		while (at < text.length && text[at] === benchCase.expected[at]) {
			at++;
		}
		const from = Math.max(0, at - 30);
		problems.push(
			`${contender.name}: output differs from expected at offset ${at}\n`
			+ `      expected: …${JSON.stringify(benchCase.expected.slice(from, at + 50))}\n`
			+ `      actual:   …${JSON.stringify(text.slice(from, at + 50))}`,
		);
	}
	return problems;
}

let checksum = 0;

// Engines can hand back a string as a chain of unjoined pieces; reading a character forces the join, so that cost is timed too
function consume(output: unknown): void {
	if (typeof output === 'string' && output.length > 0) {
		checksum = (checksum + output.length + (output.codePointAt(0) ?? 0)) % 1_000_000_007;
	}
}

async function runCase(benchCase: BenchCase, contenders: Contender[], time: number): Promise<BenchResult[]> {
	const bench = new Bench({ time, warmupTime: Math.min(time, 100) });
	for (const contender of contenders) {
		bench.add(contender.name, () => {
			consume(contender.run(benchCase.input));
		});
	}
	await bench.run();

	const results: BenchResult[] = bench.tasks
		.map((task) => {
			const result = task.result;
			if (result.state !== 'completed') {
				return { name: task.name, opsPerSec: 0, meanMs: 0, margin: 0 };
			}
			return {
				name: task.name,
				opsPerSec: result.throughput.mean,
				meanMs: result.latency.mean,
				margin: result.latency.rme,
			};
		})
		.toSorted((resultA, resultB) => resultB.opsPerSec - resultA.opsPerSec);

	const nameWidth = Math.max(...results.map(result => result.name.length));
	const fastest = results[0]?.opsPerSec ?? 0;
	for (const [index, result] of results.entries()) {
		let indicator = '📊';
		if (index === 0) {
			indicator = '🏆';
		} else if (index === results.length - 1) {
			indicator = '🐌';
		}
		if (result.opsPerSec === 0) {
			console.log(`❌ ${result.name.padEnd(nameWidth)}  failed to run`);
			continue;
		}
		const relative = index === 0 ? '(fastest)' : `(${(fastest / result.opsPerSec).toFixed(2)}x slower)`;
		console.log(
			`${indicator} ${result.name.padEnd(nameWidth)} ${formatNumber(result.opsPerSec).padStart(11)} ops/sec`
			+ `  ±${result.margin.toFixed(2).padStart(5)}%  ${formatTime(result.meanMs).padStart(10)}  ${relative}`,
		);
	}
	return results;
}

function opsFor(report: CaseReport, name: string): number {
	return report.results.find(result => result.name === name)?.opsPerSec ?? 0;
}

function bestOtherLibrary(report: CaseReport): BenchResult | undefined {
	return report.results.find(result => !ours.has(result.name) && result.opsPerSec > 0);
}

function geometricMean(ratios: number[]): number {
	return Math.exp(ratios.reduce((sum, ratio) => sum + Math.log(ratio), 0) / ratios.length);
}

function summarize(reports: CaseReport[], hasBaseline: boolean): string[] {
	const header = ['Case', 'ya-bbcode ops/sec', 'vs best other library'];
	if (hasBaseline) {
		header.push('vs baseline');
	}
	const rows: string[][] = [];
	let wins = 0;
	const baselineRatios: number[] = [];
	for (const report of reports) {
		const ops = opsFor(report, current);
		const other = bestOtherLibrary(report);
		const row = [report.name, formatNumber(ops)];
		if (other) {
			if (ops > other.opsPerSec) {
				wins++;
			}
			row.push(`${formatRatio(ops / other.opsPerSec)} (${other.name})`);
		} else {
			row.push('n/a');
		}
		if (hasBaseline) {
			const baselineOps = opsFor(report, baselineName);
			if (baselineOps > 0 && ops > 0) {
				baselineRatios.push(ops / baselineOps);
				row.push(formatRatio(ops / baselineOps));
			} else {
				row.push('n/a');
			}
		}
		rows.push(row);
	}

	const lines = [
		`| ${header.join(' | ')} |`,
		`| ${header.map(() => '---').join(' | ')} |`,
		...rows.map(row => `| ${row.join(' | ')} |`),
		'',
		`ya-bbcode is the fastest library in ${wins}/${reports.length} cases.`,
	];
	if (baselineRatios.length > 0) {
		lines.push(`Geometric mean against the baseline build: ${formatRatio(geometricMean(baselineRatios))}.`);
	}
	return lines;
}

function runScaling(parsers: { name: string; Parser: Parser; }[]): { reports: ScalingReport[]; failures: string[]; } {
	const reports: ScalingReport[] = [];
	const failures: string[] = [];
	const nameWidth = Math.max(...scalingScenarios.map(scenario => scenario.name.length), ...parsers.map(parser => parser.name.length + 2));
	for (const scenario of scalingScenarios) {
		for (const { name, Parser } of parsers) {
			const parser = new Parser();
			const points = measureScaling(input => consume(parser.parse(input)), scenario);
			const growth = scalingGrowth(points);
			reports.push({ scenario: scenario.name, parser: name, points, growth });

			const cells = points
				.map(point => `${formatNumber(point.size).padStart(8)}: ${(point.ms === undefined ? point.note ?? '' : formatTime(point.ms)).padEnd(16)}`)
				.join('');
			let verdict = 'did not finish';
			if (growth !== undefined) {
				verdict = `${growth.toFixed(1)}x`;
			}
			const label = name === current ? scenario.name : `  ${name}`;
			let note = '';
			if (name === current && scenario.knownSuperlinear) {
				note = `  (expected: ${scenario.knownSuperlinear})`;
			}
			console.log(`${label.padEnd(nameWidth)} ${cells} growth ${verdict}${note}`);

			if (name === current && !scenario.knownSuperlinear && (growth === undefined || growth > maxScalingGrowth)) {
				failures.push(`Scaling "${scenario.name}": cost per unit grew ${verdict} from ${formatNumber(points[0]?.size ?? 0)} to ${formatNumber(points.at(-1)?.size ?? 0)} units (limit ${maxScalingGrowth}x)`);
			}
		}
	}
	return { reports, failures };
}

function heading(title: string): void {
	console.log('\n╔═══════════════════════════════════════════════════════════════╗');
	console.log(`║ ${title.padEnd(61)} ║`);
	console.log('╚═══════════════════════════════════════════════════════════════╝');
}

async function main() {
	const time = Number(options.time);
	if (!Number.isFinite(time) || time <= 0) {
		throw new TypeError(`--time must be a positive number of milliseconds, got: ${options.time}`);
	}
	let Baseline: Parser | undefined;
	if (options.baseline) {
		const module = await import(pathToFileURL(path.resolve(options.baseline)).href) as { default: Parser; };
		Baseline = module.default;
	}
	const filter = options.filter?.toLowerCase();
	const cases = benchCases.filter(benchCase => !filter || benchCase.name.toLowerCase().includes(filter));
	if (cases.length === 0) {
		throw new Error(`No benchmark case matches --filter ${options.filter}`);
	}

	heading('BBCode Parser Performance Comparison');
	console.log(`Node ${process.version}, ${time} ms per row${Baseline ? `, baseline: ${options.baseline}` : ''}`);

	const failures: string[] = [];
	const reports: CaseReport[] = [];
	for (const benchCase of cases) {
		console.log(`\n━━━ ${benchCase.name} ━━━`);
		console.log(`Input length: ${benchCase.input.length.toLocaleString('en-US')} characters\n`);
		const contenders = buildContenders(benchCase, Baseline);
		for (const problem of findOutputProblems(benchCase, contenders)) {
			console.log(`❌ ${problem}`);
			// A baseline build is allowed to be wrong; that is often why it is being replaced
			if (!problem.startsWith(baselineName)) {
				failures.push(`${benchCase.name}: ${problem.split('\n', 1)[0]}`);
			}
		}
		const results = await runCase(benchCase, contenders, time);
		reports.push({ name: benchCase.name, inputLength: benchCase.input.length, results });
	}

	heading('Summary');
	const summary = summarize(reports, Baseline !== undefined);
	console.log(`\n${summary.join('\n')}`);

	let scaling: ScalingReport[] = [];
	if (!options['skip-scaling'] && !filter) {
		heading('Scaling (time for one parse as the input grows)');
		console.log('Growth compares time per unit at the largest and smallest size: ~1x is linear, while quadratic parsing grows by the size ratio.\n');
		const parsers = [{ name: current, Parser: yabbcode }];
		if (Baseline) {
			parsers.push({ name: baselineName, Parser: Baseline });
		}
		const scalingRun = runScaling(parsers);
		scaling = scalingRun.reports;
		failures.push(...scalingRun.failures);
	}

	if (options.json) {
		writeFileSync(options.json, JSON.stringify({ node: process.version, time, cases: reports, scaling }, null, '\t'));
		console.log(`\nResults written to ${options.json}`);
	}
	if (process.env.GITHUB_STEP_SUMMARY) {
		appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Benchmark (Node ${process.version})\n\n${summary.join('\n')}\n`);
	}

	if (failures.length > 0) {
		console.log(`\n❌ Benchmark failed:\n${failures.map(failure => `  - ${failure}`).join('\n')}\n`);
		process.exitCode = 1;
		return;
	}
	console.log('\n✓ Benchmark complete!\n');
}

await main();
