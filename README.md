# ya-bbcode
Yet another BBCode parser.
`npm install ya-bbcode --save`

[![npm version](https://badge.fury.io/js/ya-bbcode.svg)](https://badge.fury.io/js/ya-bbcode)
[![CI](https://github.com/nodecraft/ya-bbcode/actions/workflows/ci.yml/badge.svg)](https://github.com/nodecraft/ya-bbcode/actions/workflows/ci.yml)

## Usage

```javascript
const yabbcode = require('ya-bbcode');
const parser = new yabbcode();

const bbc = '[url=https://nodecraft.com]Visit Nodecraft[/url]';
parser.parse(bbc);
// <a href="https://nodecraft.com">Visit Nodecraft</a>
```

##### Add Custom Tags

```javascript
parser.registerTag('url', {
	type: 'replace',
	open: (attr) => {
		return `<a href="${attr || '#'}" rel="noopener norefer">`;
	},
	close: '</a>'
});

// Remove all default or registered tags
parser.clearTags();
```

### Why ya-bbcode?
 - **Supports nested BBCode**: Properly handles complex nested structures
 - **Zero dependencies**: Lightweight with no external dependencies
 - **Correct parsing**: Parent nodes are parsed before children in nested format
 - **Customizable**: Easy to add or override tags
 - **Fast**: Single-pass parser, benchmarked against other BBCode libraries on every pull request

### Benchmarks
`npm run build && npm run bench` compares ya-bbcode with other BBCode parsers on a set of documents, checks that ya-bbcode's output for each one is exactly the expected HTML, and measures how parse time grows with input size. The run fails if any output is wrong or if parsing stops scaling linearly.

Options go after `--`, for example `npm run bench -- --filter list --time 200`:

| Option | Effect |
| --- | --- |
| `--baseline <path>` | Also measure another build of ya-bbcode (such as a copy of `dist/ya-bbcode.mjs` from `main`) and report the speed-up against it |
| `--filter <text>` | Only run the cases whose name contains the text |
| `--time <ms>` | Time spent measuring each row (default 500) |
| `--json <path>` | Write every measurement to a file |
| `--skip-scaling` | Skip the input-size scaling section |

Results in operations per second (higher is better) on Node 26. `@bbob/parser` only builds a syntax tree; the others render HTML.

| Case | ya-bbcode | @bbob/html | @bbob/parser | xbbcode-parser |
| --- | --- | --- | --- | --- |
| Short (Simple Bold) | 1,337,472 | 233,413 | 410,176 | 95,803 |
| Medium (Nested Quote) | 580,203 | 74,614 | 125,420 | 39,603 |
| Long (Forum Post) | 154,402 | 13,388 | 19,912 | 11,854 |
| Complex (Deep Nesting) | 143,763 | 19,311 | 29,268 | 7,148 |
| Deep Nesting (5 levels) | 419,269 | 74,212 | 113,577 | 34,437 |
| URL Heavy (10 links) | 144,913 | 19,638 | 26,843 | 16,260 |
| List Heavy (50 items) | 26,555 | 1,650 | 3,338 | 867 |
| Image Gallery (12 linked images) | 52,083 | 8,855 | 13,470 | 5,983 |
| Plain Text (no tags) | 874,507 | 17,104 | 22,061 | 134,275 |
| HTML Heavy (escaping) | 67,709 | 9,907 | 11,465 | 40,151 |
| Noparse Block (90 literal tags) | 108,082 | 3,746 | 5,279 | 11,798 |
| Malformed (tag soup) | 132,255 | 21,548 | 29,741 | 28,053 |
| Guide (8 mixed sections) | 19,347 | 2,010 | 3,127 | 1,266 |
| Large Document (BBob stub) | 5,260 | 779 | 1,015 | 321 |

### Changelog
Release notes are published on [GitHub Releases](https://github.com/nodecraft/ya-bbcode/releases). Notes for 5.0.0 and earlier are in [CHANGELOG.md](CHANGELOG.md).
