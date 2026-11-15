import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import yabbc from '../../dist/ya-bbcode.mjs';
import { fuzzParams } from './env';
import { findUnsafeOutput } from './oracle';

// Default tags plus unknown, placeholder-shaped and prototype-shaped names
const tagNames = [
	'url',
	'quote',
	'b',
	'u',
	'i',
	'h1',
	'h6',
	'code',
	'hr',
	'strike',
	'spoiler',
	'list',
	'olist',
	'*',
	'img',
	'noparse',
	'URL',
	'IMG',
	'x',
	'TAG-0',
	'TAG-1',
	'TAG-10',
	'__proto__',
	'constructor',
];

// Fragments that have broken this parser or parsers like it: replacement patterns, entities, quotes, schemes, NUL
const nasty = [
	'$&',
	'$\'',
	'$`',
	'$$',
	'$1',
	'$<x>',
	'"',
	'\'',
	'<',
	'>',
	'&',
	'&amp;',
	'&quot;',
	'&#39;',
	'&lt;',
	'&colon;',
	'\0',
	'\n',
	'\r\n',
	'\t',
	' ',
	'=',
	'[',
	']',
	'/',
	'^',
	'[TAG-0]',
	'[TAG-1]',
	'[TAG-10]',
	'javascript:alert(1)',
	'JaVaScRiPt:alert(1)',
	' javascript:alert(1)',
	'java\tscript:alert(1)',
	'data:text/html,x',
	'x onerror=alert(1) ',
	'https://example.com/?a=1&b=2',
	'//evil.example',
	'__proto__',
	'constructor',
];

const text = fc.oneof(fc.string({ maxLength: 12 }), fc.string({ unit: 'binary', maxLength: 6 }));
const piece = fc.oneof({ weight: 3, arbitrary: fc.constantFrom(...nasty) }, { weight: 1, arbitrary: text });
// Tag regex stops at `]`, so attribute values never contain it
const value = fc.array(piece, { maxLength: 4 }).map(parts => parts.join('').replaceAll(']', ''));

const tag = fc.oneof(
	fc.constantFrom(...tagNames).map(name => `[${name}]`),
	fc.constantFrom(...tagNames).map(name => `[/${name}]`),
	fc.tuple(fc.constantFrom(...tagNames), value).map(([name, attr]) => `[${name}=${attr}]`),
	fc.tuple(fc.constantFrom(...tagNames), value, value).map(([name, first, second]) => `[${name} k=${first} ${second}]`),
);

const bbcode = fc.array(
	fc.oneof({ weight: 3, arbitrary: tag }, { weight: 2, arbitrary: piece }),
	{ maxLength: 60 },
).map(parts => parts.join(''));

// More than 50 top-level replace tags takes the separate optimized code path
const largeDocument = fc.array(
	fc.tuple(fc.constantFrom('b', 'i', 'url', 'quote', 'x'), value, piece),
	{ minLength: 51, maxLength: 70 },
).map(items => items.map(([name, attr, inner]) => `[${name}=${attr}]${inner}[/${name}]`).join(''));

const input = fc.oneof({ weight: 4, arbitrary: bbcode }, { weight: 1, arbitrary: largeDocument });

const layoutConfig = fc.record({
	newline: fc.boolean(),
	paragraph: fc.boolean(),
	cleanUnmatchable: fc.boolean(),
});

function expectSafe(output: string, source: string): void {
	expect(findUnsafeOutput(output), `input: ${JSON.stringify(source)}\noutput: ${JSON.stringify(output)}`).toEqual([]);
}

describe('fuzz: parse', () => {
	it('never throws, is deterministic and leaves Object.prototype alone', () => {
		const baseline = Object.getOwnPropertyNames(Object.prototype).join(',');
		fc.assert(
			fc.property(input, layoutConfig, fc.boolean(), (source, layout, sanitizeHtml) => {
				const parser = new yabbc({ ...layout, sanitizeHtml });
				const output = parser.parse(source);
				expect(typeof output).toBe('string');
				expect(parser.parse(source)).toBe(output);
				expect(Object.getOwnPropertyNames(Object.prototype).join(',')).toBe(baseline);
			}),
			fuzzParams,
		);
	});

	it('produces only safe HTML when sanitizeHtml is on', () => {
		fc.assert(
			fc.property(input, layoutConfig, (source, layout) => {
				expectSafe(new yabbc({ ...layout, sanitizeHtml: true }).parse(source), source);
			}),
			fuzzParams,
		);
	});

	// A trailing unclosed `[` would merge with `[/noparse]` into one tag, so those inputs aren't a closed noparse
	it('returns noparse content exactly as written', () => {
		const literal = bbcode.filter(source => !/noparse/i.test(source) && !/\[[^\]]*$/.test(source));
		fc.assert(
			fc.property(literal, fc.boolean(), (source, cleanUnmatchable) => {
				const parser = new yabbc({ sanitizeHtml: false, newline: false, cleanUnmatchable });
				expect(parser.parse(`[noparse]${source}[/noparse]`)).toBe(source.replaceAll('\0', ''));
			}),
			fuzzParams,
		);
	});

	// Without sanitizeHtml raw HTML passes through by design, but tag output must still never let input escape an attribute
	it('produces only safe HTML when sanitizeHtml is off and the input has no raw HTML', () => {
		fc.assert(
			fc.property(input.filter(source => !/[<>]/.test(source)), layoutConfig, (source, layout) => {
				expectSafe(new yabbc({ ...layout, sanitizeHtml: false }).parse(source), source);
			}),
			fuzzParams,
		);
	});
});
