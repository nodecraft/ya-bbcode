import { parse } from '@bbob/parser';
import { Bench } from 'tinybench';
import xbbcode from 'xbbcode-parser';

import yabbcode from '../dist/ya-bbcode.mjs';
import stub from './stub.ts';
import { testCases } from './test-cases.ts';

function formatNumber(num: number): string {
	return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

interface BenchResult {
	name: string;
	opsPerSec: number;
	mean: number;
	margin: number;
}

async function runBenchmark(name: string, input: string, chTagOnly = false): Promise<BenchResult[]> {
	console.log(`\n━━━ ${name} ━━━`);
	console.log(`Input length: ${input.length.toLocaleString()} characters\n`);

	const bench = new Bench({ time: 1000 });

	// ya-bbcode setup
	if (chTagOnly) {
		// For stub benchmark - only parse [ch] tag like BBob benchmark
		// https://github.com/JiLiZART/BBob/blob/5904ef46ed3d1c9b1827f89c5282848945d98338/benchmark/index.js
		bench.add('ya-bbcode', () => {
			const yaParser = new yabbcode();
			yaParser.registerTag('ch', {
				type: 'replace',
				open: '<div>',
				close: '</div>',
			});
			yaParser.parse(input);
		});
	} else {
		// For other benchmarks - use default tags
		bench.add('ya-bbcode', () => {
			const yaParser = new yabbcode();
			yaParser.parse(input);
		});
	}

	if (chTagOnly) {
		// xbbcode-parser with only [ch] tag
		bench.add('xbbcode-parser', () => {
			xbbcode.addTags({
				ch: {
					openTag: () => '<div>',
					closeTag: () => '</div>',
					restrictChildrenTo: [],
				},
			});
			return xbbcode.process({
				text: input,
				removeMisalignedTags: false,
				addInLineBreaks: false,
			});
		});

		// @bbob/parser with only [ch] tag
		bench.add('@bbob/parser', () => {
			parse(input, {
				onlyAllowTags: ['ch'],
			});
		});
	} else {
		// Default parsers
		bench.add('xbbcode-parser', () => {
			xbbcode.process({
				text: input,
				removeMisalignedTags: false,
				addInLineBreaks: false,
			});
		});

		bench.add('@bbob/parser', () => {
			parse(input);
		});
	}

	await bench.run();

	// Sort results by ops/sec (descending)
	const results: BenchResult[] = bench.tasks
		.map((task) => {
			const result = task.result;
			if (result.state !== 'completed') {
				return { name: task.name, opsPerSec: 0, mean: 0, margin: 0 };
			}
			return {
				name: task.name,
				opsPerSec: result.throughput.mean,
				mean: result.latency.mean,
				margin: result.latency.rme,
			};
		})
		.toSorted((resultA, resultB) => resultB.opsPerSec - resultA.opsPerSec);

	// Display results
	const maxNameLength = Math.max(...results.map(result => result.name.length));

	for (const [index, result] of results.entries()) {
		const indicator = index === 0 ? '🏆' : (index === results.length - 1 ? '🐌' : '📊');
		const name = result.name.padEnd(maxNameLength);
		const ops = formatNumber(result.opsPerSec).padStart(10);
		const fastestOps = results[0]?.opsPerSec ?? 1;
		const relative = index === 0
			? '(fastest)'
			: `(${(fastestOps / result.opsPerSec).toFixed(2)}x slower)`;

		console.log(`${indicator} ${name} ${ops} ops/sec  ±${result.margin.toFixed(2)}%  ${relative}`);
	}

	return results;
}

async function main() {
	console.log('\n╔═══════════════════════════════════════════════════════════════╗');
	console.log('║          BBCode Parser Performance Comparison                 ║');
	console.log('╚═══════════════════════════════════════════════════════════════╝');

	const allResults: Record<string, BenchResult[]> = {};

	// Run all benchmarks
	allResults['Short (Simple Bold)'] = await runBenchmark('Short (Simple Bold)', testCases.short);
	allResults['Medium (Nested Quote)'] = await runBenchmark('Medium (Nested Quote)', testCases.medium);
	allResults['Long (Forum Post)'] = await runBenchmark('Long (Forum Post)', testCases.long);
	allResults['Complex (Deep Nesting)'] = await runBenchmark('Complex (Deep Nesting)', testCases.complex);
	allResults['Deep Nesting (5 levels)'] = await runBenchmark('Deep Nesting (5 levels)', testCases.deepNesting);
	allResults['URL Heavy (10 links)'] = await runBenchmark('URL Heavy (10 links)', testCases.urlHeavy);
	allResults['List Heavy (50 items)'] = await runBenchmark('List Heavy (50 items)', testCases.listHeavy);
	allResults['Large Document (BBob stub)'] = await runBenchmark('Large Document (BBob stub)', stub, true);

	// Summary
	console.log('\n╔═══════════════════════════════════════════════════════════════╗');
	console.log('║                          Summary                              ║');
	console.log('╚═══════════════════════════════════════════════════════════════╝\n');

	const wins: Record<string, number> = { 'ya-bbcode': 0, 'xbbcode-parser': 0, '@bbob/parser': 0 };
	for (const results of Object.values(allResults)) {
		const winner = results[0];
		if (!winner) {
			continue;
		}
		wins[winner.name] = (wins[winner.name] ?? 0) + 1;
	}

	console.log('Wins (fastest in category):');
	for (const [parser, count] of Object.entries(wins)
		.toSorted((entryA, entryB) => entryB[1] - entryA[1])) {
		const percentage = ((count / Object.keys(allResults).length) * 100).toFixed(0);
		console.log(`  ${parser}: ${count}/${Object.keys(allResults).length} (${percentage}%)`);
	}

	console.log('\n✓ Benchmark complete!\n');
}

main().catch(console.error);
