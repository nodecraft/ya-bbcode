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

// Long runs of matched pairs, the shape large real posts take
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

// Tags whose HTML is fixed, so a nested document can be rendered here without going through the parser
const staticTags: Record<string, [open: string, close: string]> = {
	b: ['<strong>', '</strong>'],
	i: ['<i>', '</i>'],
	u: ['<u>', '</u>'],
	h1: ['<h1>', '</h1>'],
	h6: ['<h6>', '</h6>'],
	code: ['<code>', '</code>'],
	strike: ['<span class="yabbcode-strike">', '</span>'],
	spoiler: ['<span class="yabbcode-spoiler">', '</span>'],
	list: ['<ul>', '</ul>'],
	olist: ['<ol>', '</ol>'],
};

interface Rendered {
	bbcode: string;
	html: string;
}

// Tags in staticTags that drop the newlines beside them when newlines are converted
const blockTag = /\[\/?(?:h1|h6|list|olist)\]/;

// Rendered with newlines kept, since which newlines block tags drop is covered by the unit tests
const plainText = fc.constantFrom('', 'a', 'some text', ' ', '\n', 'x\ny').map((value): Rendered => {
	return { bbcode: value, html: value };
});

// Properly nested documents, paired with the HTML they must become
const { nested } = fc.letrec<{ nested: Rendered; }>((tie) => {
	return {
		nested: fc.oneof(
			{ maxDepth: 6 },
			plainText,
			fc.tuple(fc.constantFrom(...Object.keys(staticTags)), fc.array(tie('nested'), { maxLength: 4 })).map(([name, children]): Rendered => {
				const [open, close] = staticTags[name] ?? ['', ''];
				return {
					bbcode: `[${name}]${children.map(child => child.bbcode).join('')}[/${name}]`,
					html: open + children.map(child => child.html).join('') + close,
				};
			}),
		),
	};
});

const nestedDocument = fc.array(nested, { maxLength: 6 }).map((items): Rendered => {
	return {
		bbcode: items.map(item => item.bbcode).join(''),
		html: items.map(item => item.html).join(''),
	};
});

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

	it('renders every tag of a properly nested document', () => {
		fc.assert(
			fc.property(nestedDocument, ({ bbcode: source, html }) => {
				expect(new yabbc({ newline: false }).parse(source)).toBe(html);
			}),
			fuzzParams,
		);
	});

	it('converts newlines in a properly nested document, dropping only those beside block tags', () => {
		fc.assert(
			fc.property(nestedDocument, ({ bbcode: source, html }) => {
				const output = new yabbc().parse(source);
				if (blockTag.test(source)) {
					expect(output.replaceAll('<br/>', '')).toBe(html.replaceAll('\n', ''));
					expect(output.split('<br/>').length).toBeLessThanOrEqual(html.split('\n').length);
				} else {
					expect(output).toBe(html.replaceAll('\n', '<br/>'));
				}
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
