import { describe, expect, it } from 'vitest';

import { benchCases } from '../benchmark/test-cases.ts';
import yabbc from '../dist/ya-bbcode.mjs';

const newlineTest = `[h1]Nodecraft[/h1]
[b]Game Servers Done Right[/b]`;
const newlineNoTagTest = `Nodecraft
Game Servers Done Right`;

const bbcodes = {
	none: 'Nodecraft Game servers',
	invalid: '[Nodecraft]Game servers[/nodecraft]',
	unclosed: '[strong]Nodecraft [b]Game servers[/b]',
	unmatchable: '[b]Game Servers Done Right![img][/b]',
	ordering: '[quote=[b]text[/b][/quote]',
	nested: '[url=https://nodecraft.com][img]https://nodecraft.com/assets/images/logo.png[/img][/url]',
	nested_deep: '[url=https://nodecraft.com][b]Game Servers [u][i]Done Right[/i][/u][/b][/url]',
	url: '[url=https://nodecraft.com]Visit Nodecraft[/url]',
	url_no_attr: '[url]Visit Nodecraft[/url]',
	url_with_query: '[url=https://nodecraft.com?foobar=foo]Visit Nodecraft[/url]',
	nodecraft_url: '[nodecraft-url][/nodecraft-url]',
	pre: '[pre]Minecraft is a really fun game![/pre]',
	quote: '[quote=Nodecraft]Game Servers Done Right![/quote]',
	quote_no_attr: '[quote]Game Servers Done Right![/quote]',
	quote_with_space_in_attr: '[quote=Some user]Game Servers Done Right![/quote]',
	brand_replace: '[brand][/brand]',
	b: '[b]Game Servers Done Right![/b]',
	u: '[u]Game Servers Done Right![/u]',
	i: '[i]Game Servers Done Right![/i]',
	h1: '[h1]Game Servers Done Right![/h1]',
	h2: '[h2]Game Servers Done Right![/h2]',
	h3: '[h3]Game Servers Done Right![/h3]',
	h4: '[h4]Game Servers Done Right![/h4]',
	h5: '[h5]Game Servers Done Right![/h5]',
	h6: '[h6]Game Servers Done Right![/h6]',
	code: '[code]new yabbcode();[/code]',
	hr: '[hr][/hr]',
	hr_standalone: '[hr]',
	strike: '[strike]getnodecraft.net[/strike]',
	spoiler: '[spoiler]The cake is a lie[/spoiler]',
	list: '[list][*] Minecraft Servers[*] ARK Servers[*] PixARK Servers[*] Rust Servers[/list]',
	olist: '[olist][*] Pick your games[*] Create your bot[*] Get ingame![/olist]',
	img: '[img=Nodecraft]https://nodecraft.com/assets/images/logo.png[/img]',
	img_no_attr: '[img]https://nodecraft.com/assets/images/logo.png[/img]',
	img_invalid: '[img][/img]',
	noparse: '[noparse][img]https://nodecraft.com/assets/images/logo.png[/img][/noparse]',
	noparse_nested: '[noparse][url=https://nodecraft.com][img]https://nodecraft.com/assets/images/logo.png[/img][/url][/noparse]',
	noparse_unclosed: '[noparse][img]https://nodecraft.com/assets/images/logo.png[/img]',
	newline: newlineTest,
	newline_notag: newlineNoTagTest,
	html: '<strong>Nodecraft</strong>',
};

describe('ya-bbcode', () => {
	it('No BBCode', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.none)).toBe(bbcodes.none);
	});
	it('Invalid BBCode / tags', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.invalid), bbcodes.invalid);
	});
	it('BBCode ordering test', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.ordering)).toBe('<blockquote author="[b">text</blockquote>');
	});
	it('Nested BBCode', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.nested)).toBe('<a href="https://nodecraft.com"><img src="https://nodecraft.com/assets/images/logo.png" alt=""/></a>');
	});
	it('Deep Nested BBCode', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.nested_deep)).toBe('<a href="https://nodecraft.com"><strong>Game Servers <u><i>Done Right</i></u></strong></a>');
	});
	it('Non string input', () => {
		const parser = new yabbc();
		// @ts-expect-error - Testing invalid input type
		expect(parser.parse(undefined)).toBe('');
		expect(parser.parse(true)).toBe('');
		// @ts-expect-error - Testing invalid input type
		expect(parser.parse({})).toBe('');
		// @ts-expect-error - Testing invalid input type
		expect(parser.parse([])).toBe('');
		// @ts-expect-error - Testing invalid input type
		expect(parser.parse(() => {})).toBe('');
		expect(parser.parse(1)).toBe('1');
		expect(parser.parse(12)).toBe('12');
	});
	it('Tag: url', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.url)).toBe('<a href="https://nodecraft.com">Visit Nodecraft</a>');
		expect(parser.parse(bbcodes.url_no_attr)).toBe('<a href="#">Visit Nodecraft</a>');
		expect(parser.parse(bbcodes.url_with_query)).toBe('<a href="https://nodecraft.com?foobar=foo">Visit Nodecraft</a>');
	});
	it('Tag: quote', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.quote)).toBe('<blockquote author="Nodecraft">Game Servers Done Right!</blockquote>');
		expect(parser.parse(bbcodes.quote_no_attr)).toBe('<blockquote author="">Game Servers Done Right!</blockquote>');
		expect(parser.parse(bbcodes.quote_with_space_in_attr)).toBe('<blockquote author="Some user">Game Servers Done Right!</blockquote>');
	});
	it('Tag: b', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.b)).toBe('<strong>Game Servers Done Right!</strong>');
	});
	it('Tag: u', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.u)).toBe('<u>Game Servers Done Right!</u>');
	});
	it('Tag: i', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.i)).toBe('<i>Game Servers Done Right!</i>');
	});
	it('Tags: headers', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.h1)).toBe('<h1>Game Servers Done Right!</h1>');
		expect(parser.parse(bbcodes.h2)).toBe('<h2>Game Servers Done Right!</h2>');
		expect(parser.parse(bbcodes.h3)).toBe('<h3>Game Servers Done Right!</h3>');
		expect(parser.parse(bbcodes.h4)).toBe('<h4>Game Servers Done Right!</h4>');
		expect(parser.parse(bbcodes.h5)).toBe('<h5>Game Servers Done Right!</h5>');
		expect(parser.parse(bbcodes.h6)).toBe('<h6>Game Servers Done Right!</h6>');
	});
	it('Tag: code', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.code)).toBe('<code>new yabbcode();</code>');
	});
	it('Tag: hr', () => {
		const parser = new yabbc();
		// Steam-style [hr][/hr]
		expect(parser.parse(bbcodes.hr)).toBe('<hr/>');
		// Standalone [hr] without closing tag
		expect(parser.parse(bbcodes.hr_standalone)).toBe('<hr/>');
		// With surrounding content
		expect(parser.parse('Above[hr][/hr]Below')).toBe('Above<hr/>Below');
	});
	it('Tag: strike', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.strike)).toBe('<span class="yabbcode-strike">getnodecraft.net</span>');
	});
	it('Tag: spoiler', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.spoiler)).toBe('<span class="yabbcode-spoiler">The cake is a lie</span>');
	});
	it('Tag: list', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.list)).toBe('<ul><li> Minecraft Servers</li><li> ARK Servers</li><li> PixARK Servers</li><li> Rust Servers</li></ul>');
	});
	it('Tag: olist', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.olist)).toBe('<ol><li> Pick your games</li><li> Create your bot</li><li> Get ingame!</li></ol>');
	});
	it('Tag: img', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.img)).toBe('<img src="https://nodecraft.com/assets/images/logo.png" alt="Nodecraft"/>');
		expect(parser.parse(bbcodes.img_no_attr)).toBe('<img src="https://nodecraft.com/assets/images/logo.png" alt=""/>');
		expect(parser.parse(bbcodes.img_invalid)).toBe('');
	});
	it('Tag: noparse', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.noparse)).toBe('[img]https://nodecraft.com/assets/images/logo.png[/img]');
	});
	it('Tag: noparse nested', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.noparse_nested)).toBe('[url=https://nodecraft.com][img]https://nodecraft.com/assets/images/logo.png[/img][/url]');
	});
	it('Tag: noparse unclosed', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.noparse_unclosed)).toBe('[img]https://nodecraft.com/assets/images/logo.png[/img]');
	});
	it('Tag: noparse keeps unmatched closing tags as text', () => {
		const parser = new yabbc();
		expect(parser.parse('[noparse][/b][/noparse]')).toBe('[/b]');
		expect(parser.parse('[noparse]a[/b]b[/noparse]')).toBe('a[/b]b');
		expect(parser.parse('[noparse][/b]')).toBe('[/b]');
		expect(parser.parse('[noparse][noparse][/noparse]')).toBe('[noparse]');
	});
	it('Tag: noparse contents never pair with tags outside it', () => {
		const parser = new yabbc();
		expect(parser.parse('[b][noparse][/b][/noparse]')).toBe('<strong>[/b]');
		expect(parser.parse('[noparse][b][/noparse][b]x[/b]')).toBe('[b]<strong>x</strong>');
		// A tag inside noparse can contain the closing tag's text, which must not be mistaken for the real close
		expect(parser.parse('[noparse][a[/noparse] [/noparse]')).toBe('[a[/noparse] ');
	});
	it('Tag: noparse closes even when a quoted value inside it never does', () => {
		const parser = new yabbc();
		expect(parser.parse('[noparse][url="x][/noparse] [b]bold[/b] "]')).toBe('[url=&quot;x] <strong>bold</strong> &quot;]');
		expect(new yabbc({ sanitizeHtml: false }).parse('[noparse][quote=\'a][/noparse][i]b[/i]\']')).toBe('[quote=\'a]<i>b</i>\']');
	});
	it('Custom Tag, all functions', () => {
		const parser = new yabbc();
		parser.registerTag('url', {
			type: 'replace',
			open: attr => `<a href="${attr || '#'}" rel="noopener nofollow" target="_blank">`,
			close: () => '</a>',
		});
		expect(parser.parse(bbcodes.url)).toBe('<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft</a>');
	});
	it('Custom Tag, all strings', () => {
		const parser = new yabbc();
		parser.registerTag('nodecraft-url', {
			type: 'replace',
			open: '<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft',
			close: '</a>',
		});
		expect(parser.parse(bbcodes.nodecraft_url)).toBe('<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft</a>');
	});
	it('Custom Tag, string open', () => {
		const parser = new yabbc();
		parser.registerTag('nodecraft-url', {
			type: 'replace',
			open: '<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft',
			close: () => '</a>',
		});
		expect(parser.parse(bbcodes.nodecraft_url)).toBe('<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft</a>');
	});
	it('Custom Tag, string close', () => {
		const parser = new yabbc();
		parser.registerTag('nodecraft-url', {
			type: 'replace',
			open: () => '<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft',
			close: '</a>',
		});
		expect(parser.parse(bbcodes.nodecraft_url)).toBe('<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft</a>');
	});
	it('Custom Tag, content with replace func', () => {
		const parser = new yabbc();
		parser.registerTag('pre', {
			type: 'content',
			replace: (_attr, content) => `<pre>${content}</pre>`,
		});
		expect(parser.parse(bbcodes.pre)).toBe('<pre>Minecraft is a really fun game!</pre>');
	});
	it('Custom Tag, content with string replace', () => {
		const parser = new yabbc();
		parser.registerTag('brand', {
			type: 'content',
			replace: 'Nodecraft',
		});
		expect(parser.parse(bbcodes.brand_replace)).toBe('Nodecraft');
	});
	it('Custom Tag: Invalid Type', () => {
		const parser = new yabbc();
		parser.registerTag('url', {
			// @ts-expect-error - Testing invalid tag type to verify error handling
			type: 'expand',
			open: () => '<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft',
			close: () => '</a>',
		});
		expect(() => {
			parser.parse(bbcodes.url);
		}).toThrowError(/Cannot parse content block/);
	});
	it('New line: converted', () => {
		const parser = new yabbc({ newline: true });
		expect(parser.parse(bbcodes.newline)).toBe('<h1>Nodecraft</h1><strong>Game Servers Done Right</strong>');
		expect(parser.parse(bbcodes.newline_notag)).toBe('Nodecraft<br/>Game Servers Done Right');
	});
	it('New line: retained', () => {
		const parser = new yabbc({ newline: false });
		expect(parser.parse(bbcodes.newline)).toBe('<h1>Nodecraft</h1>\n<strong>Game Servers Done Right</strong>');
	});
	it('New line: converted with no tag', () => {
		const parser = new yabbc({ newline: true });
		expect(parser.parse(bbcodes.newline_notag)).toBe('Nodecraft<br/>Game Servers Done Right');
	});
	it('Paragraph: enabled', () => {
		const parser = new yabbc({ newline: true, paragraph: true });
		expect(parser.parse(bbcodes.newline)).toBe('<p><h1>Nodecraft</h1></p><p><strong>Game Servers Done Right</strong></p>');
	});
	it('Clean unmatchable: cleaned', () => {
		const parser = new yabbc({ cleanUnmatchable: true });
		expect(parser.parse(bbcodes.unmatchable)).toBe('<strong>Game Servers Done Right!</strong>');
	});
	it('Clean unmatchable: retained', () => {
		const parser = new yabbc({ cleanUnmatchable: false });
		expect(parser.parse(bbcodes.unmatchable)).toBe('<strong>Game Servers Done Right![img]</strong>');
	});
	it('Clear tags', () => {
		const parser = new yabbc();
		parser.clearTags();
		expect(parser.parse(bbcodes.b)).toBe('[b]Game Servers Done Right![/b]');
	});
	it('Sanitize HTML', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.html)).toBe('&lt;strong&gt;Nodecraft&lt;/strong&gt;');
	});
	it('Do not sanitize HTML', () => {
		const parser = new yabbc({ sanitizeHtml: false });
		expect(parser.parse(bbcodes.html)).toBe('<strong>Nodecraft</strong>');
	});
	it('Unmatched opening tag with children', () => {
		const parser = new yabbc();
		// Opening tag without closing - children should still be processed
		// Unmatched opening tags don't get closing tags
		expect(parser.parse('[b][i]test[/i]')).toBe('<strong><i>test</i>');
	});
	it('Several sibling tags', () => {
		const parser = new yabbc();
		const input = '[b]one[/b] [i]two[/i] [u]three[/u]';
		expect(parser.parse(input)).toBe('<strong>one</strong> <i>two</i> <u>three</u>');
	});
	it('Many sibling tags (>50)', () => {
		const parser = new yabbc();
		// Large documents used to take a separate code path, so this size stays covered
		let input = '';
		for (let i = 0; i < 26; i++) {
			input += '[b]test[/b] ';
		}
		const result = parser.parse(input.trim());
		expect(result).toContain('<strong>test</strong>');
		expect(result.split('<strong>').length - 1).toBe(26);
	});
	it('Invalid module type error', () => {
		const parser = new yabbc();
		// @ts-expect-error - Testing invalid module type to verify error handling
		parser.tags.invalid = { type: 'badtype' };
		expect(() => parser.parse('[invalid]test[/invalid]')).toThrow('Cannot parse content block');
	});
	it('Space-separated attributes: boolean flags', () => {
		const parser = new yabbc();
		parser.registerTag('code', {
			type: 'replace',
			open: (_attr, attrs) => {
				const classes = [];
				if (attrs['skip-lint']) {
					classes.push('skip-lint');
				}
				if (attrs.highlight) {
					classes.push('highlight');
				}
				return `<code class="${classes.join(' ')}">`;
			},
			close: '</code>',
		});
		expect(parser.parse('[code skip-lint]test[/code]')).toBe('<code class="skip-lint">test</code>');
		expect(parser.parse('[code skip-lint highlight]test[/code]')).toBe('<code class="skip-lint highlight">test</code>');
	});
	it('Space-separated attributes: key=value pairs', () => {
		const parser = new yabbc();
		parser.registerTag('code', {
			type: 'replace',
			open: (_attr, attrs) => `<code lang="${attrs.lang || 'text'}">`,
			close: '</code>',
		});
		expect(parser.parse('[code lang=javascript]test[/code]')).toBe('<code lang="javascript">test</code>');
		expect(parser.parse('[code lang=python]test[/code]')).toBe('<code lang="python">test</code>');
	});
	it('Space-separated attributes: mixed boolean and key=value', () => {
		const parser = new yabbc();
		parser.registerTag('code', {
			type: 'replace',
			open: (_attr, attrs) => {
				const lang = attrs.lang || 'text';
				const skipLint = attrs['skip-lint'] ? ' data-skip-lint="true"' : '';
				return `<code lang="${lang}"${skipLint}>`;
			},
			close: '</code>',
		});
		expect(parser.parse('[code lang=javascript skip-lint]test[/code]')).toBe('<code lang="javascript" data-skip-lint="true">test</code>');
	});
	it('Content tag with space-separated attributes', () => {
		const parser = new yabbc();
		parser.registerTag('img', {
			type: 'content',
			replace: (_attr, content, attrs) => {
				const alt = attrs.alt || '';
				const width = attrs.width ? ` width="${attrs.width}"` : '';
				return `<img src="${content}" alt="${alt}"${width}/>`;
			},
		});
		expect(parser.parse('[img alt=Logo width=100]https://example.com/logo.png[/img]')).toBe('<img src="https://example.com/logo.png" alt="Logo" width="100"/>');
	});
	it('Simple attribute syntax: [tag=value]', () => {
		const parser = new yabbc();
		// Simple attribute syntax with = should work
		expect(parser.parse('[quote=John]Hello[/quote]')).toBe('<blockquote author="John">Hello</blockquote>');
		expect(parser.parse('[url=https://example.com]Link[/url]')).toBe('<a href="https://example.com">Link</a>');
	});
	it('Custom tag with autoClose', () => {
		const parser = new yabbc();
		// Register a custom tag with autoClose for implicit closing
		parser.registerTag('item', {
			type: 'replace',
			open: '<div class="item">',
			close: null,
			autoClose: '</div>',
		});
		parser.registerTag('container', {
			type: 'replace',
			open: '<div class="container">',
			close: '</div>',
		});
		// autoClose should insert </div> before next sibling and before parent close
		expect(parser.parse('[container][item]one[item]two[/container]')).toBe('<div class="container"><div class="item">one</div><div class="item">two</div></div>');
	});
	it('autoClose works in large documents (>50 top-level tags)', () => {
		const parser = new yabbc();
		// Large documents used to take a separate code path that skipped autoClose on nested [*] items
		let input = '';
		for (let i = 0; i < 60; i++) {
			input += '[b]x[/b]';
		}
		input += '[list][*]a[*]b[/list]';
		const result = parser.parse(input);
		expect(result).toContain('<ul><li>a</li><li>b</li></ul>');
	});
	it('autoClose list items wrap inline tags inside them', () => {
		const parser = new yabbc();
		expect(parser.parse('[list][*]Item with [b]bold[/b] text[*]Next[/list]')).toBe('<ul><li>Item with <strong>bold</strong> text</li><li>Next</li></ul>');
		expect(parser.parse('[list][*][url=https://a.com]a[/url][*]b [i]c[/i][/list]')).toBe('<ul><li><a href="https://a.com">a</a></li><li>b <i>c</i></li></ul>');
	});
	it('content tag preserves nested children', () => {
		const parser = new yabbc();
		// A content tag whose replace re-emits its inner content should still
		// resolve nested formatting tags within it.
		parser.registerTag('box', {
			type: 'content',
			replace: (_attr, content) => `<div>${content}</div>`,
		});
		expect(parser.parse('[box]hello [b]world[/b][/box]')).toBe('<div>hello <strong>world</strong></div>');
	});
	it('List items without explicit closing tags (Steam BBCode format)', () => {
		const parser = new yabbc();
		// This tests the fix for issue #214 - auto-closing list items
		const input = `[list]
[*]First item
[*]Second item
[*]Third item
[/list]`;
		const result = parser.parse(input);
		// Each list item should have a closing </li> tag
		expect(result).toContain('<li>');
		expect(result).toContain('</li>');
		// Count opening and closing tags - should be equal
		const openCount = (result.match(/<li>/g) || []).length;
		const closeCount = (result.match(/<\/li>/g) || []).length;
		expect(openCount).toBe(3);
		expect(closeCount).toBe(3);
	});

	it('list items with explicit closing tags', () => {
		const parser = new yabbc();
		// This tests that explicit closing tags still work as expected
		const input = `[list]
[*]First item[/*]
[*]Second item[/*]
[*]Third item[/*]
[/list]`;
		const result = parser.parse(input);
		// Each list item should have a closing </li> tag
		expect(result).toContain('<li>');
		expect(result).toContain('</li>');
		// Count opening and closing tags - should be equal
		const openCount = (result.match(/<li>/g) || []).length;
		const closeCount = (result.match(/<\/li>/g) || []).length;
		expect(openCount).toBe(3);
		expect(closeCount).toBe(3);
	});
});

describe('Security Tests', () => {
	it('XSS Prevention: javascript: URLs blocked', () => {
		const parser = new yabbc();
		expect(parser.parse('[url=javascript:alert(1)]Click[/url]')).toBe('<a href="#">Click</a>');
		expect(parser.parse('[url=JaVaScRiPt:alert(1)]Click[/url]')).toBe('<a href="#">Click</a>');
	});

	it('XSS Prevention: img sources follow allowedSchemes', () => {
		const parser = new yabbc();
		expect(parser.parse('[img]javascript:alert(1)[/img]')).toBe('');
		expect(parser.parse('[img]java\tscript:alert(1)[/img]')).toBe('');
		expect(parser.parse('[img]data:image/png;base64,AAAA[/img]')).toBe('');
		expect(parser.parse('[img] https://example.com/a.png [/img]')).toBe('<img src="https://example.com/a.png" alt=""/>');
		expect(parser.parse('[img]/a.png[/img]')).toBe('<img src="/a.png" alt=""/>');

		const dataParser = new yabbc({ allowedSchemes: ['https', 'data'] });
		expect(dataParser.parse('[img]data:image/png;base64,AAAA[/img]')).toBe('<img src="data:image/png;base64,AAAA" alt=""/>');
	});

	it('XSS Prevention: an unmatched tag cannot hide an img scheme', () => {
		for (const cleanUnmatchable of [true, false]) {
			const parser = new yabbc({ cleanUnmatchable });
			expect(parser.parse('[img][/b]javascript:alert(1)[/img]')).toBe('');
		}
	});

	it('XSS Prevention: data: URLs blocked', () => {
		const parser = new yabbc();
		expect(parser.parse('[url=data:text/html,<script>alert(1)</script>]Click[/url]')).toBe('<a href="#">Click</a>');
	});

	it('XSS Prevention: vbscript: URLs blocked', () => {
		const parser = new yabbc();
		expect(parser.parse('[url=vbscript:alert(1)]Click[/url]')).toBe('<a href="#">Click</a>');
	});

	it('URL Validation: safe schemes allowed', () => {
		const parser = new yabbc();
		expect(parser.parse('[url=https://example.com]Link[/url]')).toBe('<a href="https://example.com">Link</a>');
		expect(parser.parse('[url=http://example.com]Link[/url]')).toBe('<a href="http://example.com">Link</a>');
		expect(parser.parse('[url=mailto:test@example.com]Email[/url]')).toBe('<a href="mailto:test@example.com">Email</a>');
		expect(parser.parse('[url=ftp://example.com]FTP[/url]')).toBe('<a href="ftp://example.com">FTP</a>');
	});

	it('URL Validation: relative URLs allowed', () => {
		const parser = new yabbc();
		expect(parser.parse('[url=/path/to/page]Link[/url]')).toBe('<a href="/path/to/page">Link</a>');
		expect(parser.parse('[url=./relative]Link[/url]')).toBe('<a href="./relative">Link</a>');
		expect(parser.parse('[url=../parent]Link[/url]')).toBe('<a href="../parent">Link</a>');
		expect(parser.parse('[url=#anchor]Link[/url]')).toBe('<a href="#anchor">Link</a>');
	});

	it('XSS Prevention: attribute injection in quote tag', () => {
		const parser = new yabbc();
		const input = '[quote=foo" onclick="alert(1)" x="]content[/quote]';
		const output = parser.parse(input);
		// Quotes are escaped (may be double-escaped due to HTML sanitization)
		expect(output).toMatch(/&(amp;)?quot;/);
		// Most importantly, the attribute injection should not create valid onclick attribute
		expect(output).not.toMatch(/onclick="alert/);
	});

	it('XSS Prevention: attribute injection in img tag', () => {
		const parser = new yabbc();
		const input = '[img=x" onerror="alert(1)]test.png[/img]';
		const output = parser.parse(input);
		// Most importantly, the attribute injection should not create valid onerror attribute
		expect(output).not.toMatch(/onerror="alert/);
		// Quotes should be escaped
		expect(output).toMatch(/&(amp;)?quot;/);
	});

	it('XSS Prevention: nested tags cannot break out of img src', () => {
		const parser = new yabbc();
		expect(parser.parse('[img][quote=x" onerror="alert(1)]y[/quote][/img]')).toBe('<img src="&lt;blockquote author=&quot;x&quot;&quot;&gt;y&lt;/blockquote&gt;" alt=""/>');
		expect(parser.parse('[img]http://x/[b]a[/b].png[/img]')).toBe('<img src="http://x/&lt;strong&gt;a&lt;/strong&gt;.png" alt=""/>');
	});

	it('XSS Prevention: HTML entities escaped in attributes', () => {
		const parser = new yabbc();
		// Angle brackets and ampersands should be escaped
		expect(parser.parse('[quote=<script>]content[/quote]')).toMatch(/&(amp;)?lt;.*&(amp;)?gt;/);
		expect(parser.parse('[url=http://example.com?foo=1&bar=2]Link[/url]')).toMatch(/&(amp;)?amp;/);
	});

	it('Prototype Pollution Prevention: __proto__ in attributes', () => {
		const parser = new yabbc();
		parser.registerTag('test', {
			type: 'replace',
			open: (_attr, attrs) => {
				// __proto__ should be filtered out
				// eslint-disable-next-line no-proto
				expect(attrs.__proto__).toBeUndefined();
				return '<test>';
			},
			close: '</test>',
		});
		parser.parse('[test __proto__=polluted]content[/test]');
	});

	it('Prototype Pollution Prevention: constructor in attributes', () => {
		const parser = new yabbc();
		parser.registerTag('test', {
			type: 'replace',
			open: (_attr, attrs) => {
				expect(attrs.constructor).toBeUndefined();
				return '<test>';
			},
			close: '</test>',
		});
		parser.parse('[test constructor=polluted]content[/test]');
	});

	it('Prototype Pollution Prevention: prototype in attributes', () => {
		const parser = new yabbc();
		parser.registerTag('test', {
			type: 'replace',
			open: (_attr, attrs) => {
				expect(attrs.prototype).toBeUndefined();
				return '<test>';
			},
			close: '</test>',
		});
		parser.parse('[test prototype=polluted]content[/test]');
	});

	it('Prototype Pollution Prevention: registerTag blocks __proto__', () => {
		const parser = new yabbc();
		expect(() => parser.registerTag('__proto__', { type: 'ignore' })).toThrow('Cannot register tag with dangerous name');
		expect(() => parser.registerTag('__PROTO__', { type: 'ignore' })).toThrow('Cannot register tag with dangerous name');
		expect(Object.getPrototypeOf(parser.tags)).toBe(Object.prototype);
	});

	it('registers constructor and prototype as ordinary tags, as Godot docs use [constructor]', () => {
		const parser = new yabbc();
		parser.registerTag('constructor', { type: 'replace', open: '<c>', close: '</c>' });
		parser.registerTag('prototype', { type: 'replace', open: '<p>', close: '</p>' });
		expect(parser.parse('[constructor]x[/constructor][prototype]y[/prototype]')).toBe('<c>x</c><p>y</p>');
		expect(Object.getPrototypeOf(parser.tags)).toBe(Object.prototype);
		// Unregistered, they are still unknown tags rather than inherited members
		expect(new yabbc().parse('[constructor]x[/constructor]')).toBe('[constructor]x[/constructor]');
	});

	it('Security: case-insensitive dangerous key blocking', () => {
		const parser = new yabbc();
		parser.registerTag('test', {
			type: 'replace',
			open: (_attr, attrs) => {
				expect(attrs.__PROTO__).toBeUndefined();
				expect(attrs.CONSTRUCTOR).toBeUndefined();
				return '<test>';
			},
			close: '</test>',
		});
		parser.parse('[test __PROTO__=bad CONSTRUCTOR=bad]content[/test]');
	});

	it('Config: custom allowedSchemes', () => {
		// Allow only https and mailto
		const parser = new yabbc({ allowedSchemes: ['https', 'mailto'] });
		expect(parser.parse('[url=https://example.com]Link[/url]')).toBe('<a href="https://example.com">Link</a>');
		expect(parser.parse('[url=mailto:test@example.com]Email[/url]')).toBe('<a href="mailto:test@example.com">Email</a>');
		// http should be blocked since it's not in allowedSchemes
		expect(parser.parse('[url=http://example.com]Link[/url]')).toBe('<a href="#">Link</a>');
		expect(parser.parse('[url=ftp://example.com]FTP[/url]')).toBe('<a href="#">FTP</a>');
	});

	it('Config: empty allowedSchemes blocks all absolute URLs', () => {
		const parser = new yabbc({ allowedSchemes: [] });
		// All absolute URLs should be blocked
		expect(parser.parse('[url=https://example.com]Link[/url]')).toBe('<a href="#">Link</a>');
		expect(parser.parse('[url=http://example.com]Link[/url]')).toBe('<a href="#">Link</a>');
		// But relative URLs should still work
		expect(parser.parse('[url=/path]Link[/url]')).toBe('<a href="/path">Link</a>');
		expect(parser.parse('[url=#anchor]Link[/url]')).toBe('<a href="#anchor">Link</a>');
	});
});


describe('Placeholder handling', () => {
	it('does not leak placeholders for unmatched tags (#402)', () => {
		const parser = new yabbc();
		expect(parser.parse('[/b]stray')).toBe('stray');
		expect(parser.parse('[img]https://example.com/a.png')).toBe('https://example.com/a.png');
		expect(parser.parse('[i]a[/i][i]b[/i][i]c[/i][i]d[/i][i]e[/i][/b]')).toBe('<i>a</i><i>b</i><i>c</i><i>d</i><i>e</i>');
	});

	it('restores unmatched tags as written when cleanUnmatchable is off', () => {
		const parser = new yabbc({ cleanUnmatchable: false });
		expect(parser.parse('[/b]stray')).toBe('[/b]stray');
		// Large documents used to take a separate code path, which must follow the same rule
		expect(parser.parse('[b]x[/b]'.repeat(60) + '[/i]')).toBe('<strong>x</strong>'.repeat(60) + '[/i]');
	});

	it('does not double-escape & in url, img and quote attributes (#402)', () => {
		const parser = new yabbc();
		expect(parser.parse('[url=https://example.com/?a=1&b=2]link[/url]')).toBe('<a href="https://example.com/?a=1&amp;b=2">link</a>');
		expect(parser.parse('[img]https://example.com/a.png?a=1&b=2[/img]')).toBe('<img src="https://example.com/a.png?a=1&amp;b=2" alt=""/>');
		expect(parser.parse('[quote=Tom & Jerry]hi[/quote]')).toBe('<blockquote author="Tom &amp; Jerry">hi</blockquote>');
	});

	it('still escapes attribute breakouts with sanitizeHtml on and off', () => {
		for (const sanitizeHtml of [true, false]) {
			const parser = new yabbc({ sanitizeHtml });
			expect(parser.parse('[quote=a"onmouseover="x]hi[/quote]')).toBe('<blockquote author="a&quot;onmouseover=&quot;x">hi</blockquote>');
			// A space-separated `key=` word becomes an attribute, so the breakout attempt never reaches the HTML at all
			expect(parser.parse('[quote=a" onmouseover="x]hi[/quote]')).toBe('<blockquote author="a&quot;">hi</blockquote>');
			expect(parser.parse('[img]a" onerror="x[/img]')).toBe('<img src="a&quot; onerror=&quot;x" alt=""/>');
		}
	});

	it('does not expand $ replacement patterns from attributes', () => {
		const parser = new yabbc();
		expect(parser.parse('[url=x]z[/url][quote=$`]a[/quote]')).toBe('<a href="x">z</a><blockquote author="$`">a</blockquote>');
		expect(parser.parse('[quote=$&]a[/quote]')).toBe('<blockquote author="$&amp;">a</blockquote>');

		const rawParser = new yabbc({ sanitizeHtml: false });
		expect(rawParser.parse('[quote=$\']a[/quote][b]b[/b]')).toBe('<blockquote author="$&#39;">a</blockquote><strong>b</strong>');
	});

	it('does not let user text forge placeholders', () => {
		const parser = new yabbc();
		expect(parser.parse('[TAG-2][b]x[/b]')).toBe('[TAG-2]<strong>x</strong>');
		const nul = '\0';
		expect(parser.parse(`${nul}2${nul}[b]x[/b]`)).toBe('2<strong>x</strong>');
		// Digits between two placeholders must not read as another placeholder
		expect(parser.parse('[url][/constructor]2[url=]')).toBe('<a href="#">2<a href="#">');
	});
});

describe('Fuzz findings', () => {
	it('treats prototype-named tags as unknown instead of throwing', () => {
		const parser = new yabbc();
		expect(parser.parse('[constructor]hi')).toBe('[constructor]hi');
		expect(parser.parse('[__proto__]x[/__proto__]')).toBe('[__proto__]x[/__proto__]');
	});

	it('blocks schemes hidden by characters browsers strip from URLs', () => {
		const parser = new yabbc();
		expect(parser.parse('[url=java\tscript:alert(1)]x[/url]')).toBe('<a href="#">x</a>');
		expect(parser.parse('[url=java\nscript:alert(1)]x[/url]')).toBe('<a href="#">x</a>');
		expect(parser.parse('[url=\u{1} javascript:alert(1)]x[/url]')).toBe('<a href="#">x</a>');
	});

	it('handles tags that span a newline', () => {
		const parser = new yabbc({ cleanUnmatchable: false });
		expect(parser.parse('[/url][noparse k= \r\n]')).toBe('[/url]');
		expect(new yabbc().parse('[url=https://example.com\n]x[/url]')).toBe('<a href="https://example.com">x</a>');
	});

	it('escapes restored tags in raw mode, since they can land inside attributes', () => {
		const parser = new yabbc({ sanitizeHtml: false, cleanUnmatchable: false });
		parser.registerTag('tip', {
			type: 'content',
			replace: (_attr, content) => `<span title="${content.replaceAll('"', '&quot;')}"></span>`,
		});
		// Unknown tags and unmatched closing tags are restored at different stages, and both must stay inside the attribute
		expect(parser.parse('[tip][x="]y[/x][/tip]')).toBe('<span title="[x=&quot;]y[/x]"></span>');
		expect(parser.parse('[tip]a[/b"][/tip]')).toBe('<span title="a[/b&quot;]"></span>');
	});

	it('converts newlines inside restored tags like the surrounding text', () => {
		expect(new yabbc({ cleanUnmatchable: false }).parse('a\n[/x\n]b')).toBe('a<br/>[/x<br/>]b');
		expect(new yabbc({ cleanUnmatchable: false, paragraph: true }).parse('a[/x\n]b')).toBe('<p>a[/x</p><p>]b</p>');
		expect(new yabbc().parse('[noparse][b\n][/noparse]')).toBe('[b<br/>]');
		expect(new yabbc({ newline: false }).parse('[x\n]y')).toBe('[x\n]y');
	});
});

describe('Nesting', () => {
	it('renders nested tags when their parent has a later sibling', () => {
		const parser = new yabbc();
		// The [i] used to be dropped because [b] is followed by [u] inside the same parent
		expect(parser.parse('[quote][b][i]x[/i][/b][u]y[/u][/quote]')).toBe('<blockquote author=""><strong><i>x</i></strong><u>y</u></blockquote>');
		expect(parser.parse('[b][i][u]a[/u][/i][/b][b][i]b[/i][/b]')).toBe('<strong><i><u>a</u></i></strong><strong><i>b</i></strong>');
	});

	it('renders tags that come after an unclosed tag', () => {
		const parser = new yabbc();
		// List items never close, and used to swallow every top-level tag after the list
		expect(parser.parse('[list][*]a[*]b[/list][b]bold[/b]')).toBe('<ul><li>a</li><li>b</li></ul><strong>bold</strong>');
		expect(parser.parse('[list][*]a[b]b[/b][*]c[/list] [olist][*]1[/*][*]2[/olist]')).toBe('<ul><li>a<strong>b</strong></li><li>c</li></ul> <ol><li>1</li><li>2</li></ol>');
		expect(parser.parse('[b]unclosed [i]x[/i] [u]y[/u]')).toBe('<strong>unclosed <i>x</i> <u>y</u>');
	});

	it('matches tag names regardless of case', () => {
		const parser = new yabbc();
		expect(parser.parse('[B]x[/b] [Quote=A]y[/QUOTE] [URL=https://example.com]z[/url]')).toBe('<strong>x</strong> <blockquote author="A">y</blockquote> <a href="https://example.com">z</a>');
	});

	it('nests far deeper than the call stack allows', () => {
		const depth = 50000;
		const output = new yabbc().parse(`${'[b]'.repeat(depth)}x${'[/b]'.repeat(depth)}`);
		expect(output).toBe(`${'<strong>'.repeat(depth)}x${'</strong>'.repeat(depth)}`);
	});

	it('uses tags registered between parse() calls', () => {
		const parser = new yabbc();
		expect(parser.parse('[b]x[/b][mark]y[/mark]')).toBe('<strong>x</strong>[mark]y[/mark]');
		parser.registerTag('b', { type: 'replace', open: '<b>', close: '</b>' });
		parser.registerTag('mark', { type: 'replace', open: '<mark>', close: '</mark>' });
		expect(parser.parse('[b]x[/b][mark]y[/mark]')).toBe('<b>x</b><mark>y</mark>');
	});

	it('lets a tag function call parse() on the same parser', () => {
		const parser = new yabbc();
		parser.registerTag('inner', {
			type: 'content',
			replace: (_attr, content) => `(${parser.parse(`[b]${content}[/b]`)})`,
		});
		expect(parser.parse('[i]a[/i][inner]x[/inner][u]b[/u]')).toBe('<i>a</i>(<strong>x</strong>)<u>b</u>');
	});

	it('passes attributes to close when open is a plain string', () => {
		const parser = new yabbc();
		parser.registerTag('note', {
			type: 'replace',
			open: '<aside>',
			close: (attr, attrs) => `<!--${attr}:${String(attrs.kind)}--></aside>`,
		});
		expect(parser.parse('[note kind=tip]x[/note]')).toBe('<aside>x<!--tip:tip--></aside>');
	});
});

describe('Newlines', () => {
	it(String.raw`treats \r\n, \r and \n each as one newline`, () => {
		expect(new yabbc().parse('a\r\nb\rc\nd\n\re')).toBe('a<br/>b<br/>c<br/>d<br/><br/>e');
		expect(new yabbc({ paragraph: true }).parse('a\r\n[b]x[/b]')).toBe('<p>a</p><p><strong>x</strong></p>');
	});

	it(String.raw`keeps \r and \n separate when a tag sits between them`, () => {
		expect(new yabbc().parse('a\r[b]x[/b]\nb')).toBe('a<br/><strong>x</strong><br/>b');
	});

	it('converts long runs of mixed line endings between tags', () => {
		// Enough newlines in one piece of text to go past the handful that are spliced in individually
		const lines = 'one\r\ntwo\rthree\nfour\n\r'.repeat(6);
		const converted = 'one<br/>two<br/>three<br/>four<br/><br/>'.repeat(6);
		expect(new yabbc().parse(`[b]${lines}[/b]${lines}`)).toBe(`<strong>${converted}</strong>${converted}`);
		expect(new yabbc({ paragraph: true }).parse(lines)).toBe(`<p>${converted.replaceAll('<br/>', '</p><p>')}</p>`);
		expect(new yabbc({ newline: false }).parse(lines)).toBe(lines);
	});
});

describe('Mis-nested content tags', () => {
	function withBox() {
		const parser = new yabbc();
		parser.registerTag('box', {
			type: 'content',
			replace: (_attr, content) => `<div>${content}</div>`,
		});
		parser.registerTag('item', {
			type: 'replace',
			open: '<div class="item">',
			close: null,
			autoClose: '</div>',
		});
		return parser;
	}

	it('still renders an image whose closing tag crosses another tag', () => {
		const parser = new yabbc();
		expect(parser.parse('[b][img]https://example.com/a.png[/b][/img]')).toBe('<strong><img src="https://example.com/a.png" alt=""/>');
		expect(parser.parse('[url=https://example.com][img]https://example.com/a.png[/url][/img]')).toBe('<a href="https://example.com"><img src="https://example.com/a.png" alt=""/>');
	});

	it('resolves a tag that closes inside a content tag it was opened outside of', () => {
		const parser = withBox();
		expect(parser.parse('[b][box]x[/b]y[/box]')).toBe('<strong><div>x</strong>y</div>');
		expect(parser.parse('[b][box]a[box]b[/b]c[/box]d[/box]')).toBe('<strong><div>a<div>b</strong>c</div>d</div>');
	});

	it('auto-closes items on both sides of a crossing tag', () => {
		const parser = withBox();
		expect(parser.parse('[b][box][item]a[/b][item]b[/box]')).toBe('<strong><div><div class="item">a</div></strong><div class="item">b</div></div>');
	});

	it('leaves a content tag unmatched when another content tag discarded one of its ends', () => {
		const parser = new yabbc();
		// The outer [img] drops everything unresolved inside it, including both tags of the inner [img]
		expect(parser.parse('[b][img]a[img]b[/img]c[/b]d[/img]')).toBe('<strong><img src="abcd" alt=""/>');
	});

	it('does not leak a placeholder that a tag function produces itself', () => {
		const parser = new yabbc();
		parser.registerTag('decode', {
			type: 'content',
			replace: (_attr, content) => decodeURIComponent(content),
		});
		// %00 decodes to the NUL that starts a placeholder, which user text is otherwise never allowed to contain
		expect(parser.parse('[decode]a%001;b[/decode][b]x[/b]')).toBe('ab<strong>x</strong>');
	});

	it('cleans up or restores unmatched tags that a content tag repeats', () => {
		const twice = { type: 'content', replace: (_attr: string, content: string) => content + content } as const;
		expect(new yabbc().registerTag('twice', twice).parse('[twice]a[/b]c[/twice]')).toBe('acac');
		expect(new yabbc({ cleanUnmatchable: false }).registerTag('twice', twice).parse('[twice]a[/b]c[/twice]')).toBe('a[/b]ca[/b]c');
	});
});

describe('Block tags', () => {
	it('drop the newline on each side of their tags instead of leaving stray line breaks', () => {
		const parser = new yabbc();
		expect(parser.parse('[list]\n[*]one\n[*]two\n[/list]\nafter')).toBe('<ul><li>one</li><li>two</li></ul>after');
		expect(parser.parse('before\r\n[quote=Bob]\r\nhi\r\n[/quote]\r\nafter')).toBe('before<blockquote author="Bob">hi</blockquote>after');
		expect(parser.parse('a\n[hr]\nb')).toBe('a<hr/>b');
	});

	it('only drop one newline, so blank lines the author wrote survive', () => {
		const parser = new yabbc();
		expect(parser.parse('a\n\n[quote]q[/quote]\n\nb')).toBe('a<br/><blockquote author="">q</blockquote><br/>b');
		expect(parser.parse('[quote]a[/quote]\n[quote]b[/quote]')).toBe('<blockquote author="">a</blockquote><blockquote author="">b</blockquote>');
		expect(parser.parse('[quote]a[/quote]\n\n[quote]b[/quote]')).toBe('<blockquote author="">a</blockquote><br/><blockquote author="">b</blockquote>');
	});

	it('leave newlines alone around inline tags, stray closing tags and when newlines are not converted', () => {
		expect(new yabbc().parse('a\n[b]x[/b]\nb')).toBe('a<br/><strong>x</strong><br/>b');
		expect(new yabbc().parse('a\n[/quote]\nb')).toBe('a<br/><br/>b');
		expect(new yabbc({ newline: false }).parse('a\n[h1]x[/h1]\nb')).toBe('a\n<h1>x</h1>\nb');
		expect(new yabbc({ paragraph: true }).parse('a\n[h1]x[/h1]\nb')).toBe('<p>a</p><p><h1>x</h1></p><p>b</p>');
	});

	it('can be declared on custom replace and content tags', () => {
		const parser = new yabbc();
		parser.registerTag('center', { type: 'replace', open: '<div>', close: '</div>', block: true });
		parser.registerTag('box', { type: 'content', replace: (_attr, content) => `<aside>${content}</aside>`, block: true });
		expect(parser.parse('a\n[center]\nx\n[/center]\n[box]\ny\n[/box]\nb')).toBe('a<div>x</div><aside>y</aside>b');
	});
});

describe('Raw content tags', () => {
	function withCodeblock(config = {}) {
		const parser = new yabbc(config);
		parser.registerTag('codeblock', {
			type: 'content',
			raw: true,
			block: true,
			replace: (_attr, content) => `<pre>${content}</pre>`,
		});
		return parser;
	}

	it('receive their content as written, with BBCode and newlines untouched but still escaped', () => {
		const parser = withCodeblock();
		expect(parser.parse('[codeblock]\nif a < b:\n\tprint("[b]x[/b]")\n[/codeblock]')).toBe('<pre>if a &lt; b:\n\tprint(&quot;[b]x[/b]&quot;)</pre>');
	});

	it('keep tags inside from pairing with tags outside', () => {
		const parser = withCodeblock();
		expect(parser.parse('[b]a[codeblock][/b][/codeblock]b[/b]')).toBe('<strong>a<pre>[/b]</pre>b</strong>');
	});

	it('hand the original text back through unescapeHtml', () => {
		let seen = '';
		const parser = new yabbc();
		parser.registerTag('code', {
			type: 'content',
			raw: true,
			replace: (_attr, content) => {
				seen = parser.unescapeHtml(content);
				return '';
			},
		});
		parser.parse('[code]a < b && "c"[/code]');
		expect(seen).toBe('a < b && "c"');
	});

	it('are not escaped when sanitizeHtml is off', () => {
		expect(withCodeblock({ sanitizeHtml: false }).parse('[codeblock]<i>[i]x[/i]</i>[/codeblock]')).toBe('<pre><i>[i]x[/i]</i></pre>');
	});

	it('still close when a quoted value inside them would run past the closing tag', () => {
		expect(withCodeblock().parse('[codeblock][url="x][/codeblock] [b]b[/b] "]')).toBe('<pre>[url=&quot;x]</pre> <strong>b</strong> &quot;]');
	});
});

describe('[url] without an attribute', () => {
	it('links to its text when that text is an absolute URL with an allowed scheme', () => {
		const parser = new yabbc();
		expect(parser.parse('[url]https://example.com/?a=1&b=2[/url]')).toBe('<a href="https://example.com/?a=1&amp;b=2">https://example.com/?a=1&amp;b=2</a>');
		expect(parser.parse('[url] mailto:a@example.com [/url]')).toBe('<a href="mailto:a@example.com"> mailto:a@example.com </a>');
	});

	it('falls back to # for labels, disallowed schemes and nested tags', () => {
		const parser = new yabbc();
		expect(parser.parse('[url]Visit Nodecraft[/url]')).toBe('<a href="#">Visit Nodecraft</a>');
		expect(parser.parse('[url]javascript:alert(1)[/url]')).toBe('<a href="#">javascript:alert(1)</a>');
		expect(parser.parse('[url]java\tscript:alert(1)[/url]')).toBe('<a href="#">java\tscript:alert(1)</a>');
		expect(parser.parse('[url][b]https://example.com[/b][/url]')).toBe('<a href="#"><strong>https://example.com</strong></a>');
		expect(parser.parse('[url]https://example.com/[b]x[/b][/url]')).toBe('<a href="#">https://example.com/<strong>x</strong></a>');
		expect(new yabbc({ allowedSchemes: ['https'] }).parse('[url]http://example.com[/url]')).toBe('<a href="#">http://example.com</a>');
	});

	it('passes the text between the tags to custom replace tags', () => {
		const parser = new yabbc();
		parser.registerTag('email', {
			type: 'replace',
			open: (attr, _attrs, content) => `<a href="mailto:${parser.escapeHtml(attr || content)}">`,
			close: '</a>',
		});
		expect(parser.parse('[email]a@example.com[/email] [email=b@example.com]me[/email]')).toBe('<a href="mailto:a@example.com">a@example.com</a> <a href="mailto:b@example.com">me</a>');
	});
});

describe('Mixed [tag=value key=value] attributes', () => {
	function capture(input: string) {
		let seen: [string, Record<string, string | boolean>] = ['', {}];
		const parser = new yabbc();
		parser.registerTag('item', {
			type: 'replace',
			open: (attr, attrs) => {
				seen = [attr, { ...attrs }];
				return '';
			},
			close: null,
		});
		parser.parse(input);
		return seen;
	}

	it('splits the value from the key=value words and flags after it', () => {
		expect(capture('[item=123 domain=ptr]')).toEqual(['123', { domain: 'ptr' }]);
		expect(capture('[item=John Smith post=12 pinned]')).toEqual(['John Smith', { post: '12', pinned: true }]);
	});

	it('keeps spaces and = inside a value that has no key=value words after it', () => {
		expect(capture('[item=Some user]')).toEqual(['Some user', {}]);
		expect(capture('[item=https://example.com/?a=1]')).toEqual(['https://example.com/?a=1', {}]);
	});

	it('still drops prototype-shaped keys', () => {
		expect(Object.keys(capture('[item=1 __proto__=x constructor=y ok=z]')[1])).toEqual(['ok']);
	});
});

describe('Quoted attribute values', () => {
	function capture(input: string, config = {}) {
		let seen: [string, Record<string, string | boolean>] = ['', {}];
		const parser = new yabbc(config);
		parser.registerTag('item', {
			type: 'replace',
			open: (attr, attrs) => {
				seen = [attr, { ...attrs }];
				return '';
			},
			close: null,
		});
		parser.parse(input);
		return seen;
	}

	it('come without their quotes, with sanitizeHtml on and off', () => {
		for (const sanitizeHtml of [true, false]) {
			const parser = new yabbc({ sanitizeHtml });
			expect(parser.parse('[URL="https://example.com/a"]x[/URL] [url=\'https://example.com/b\']y[/url]')).toBe('<a href="https://example.com/a">x</a> <a href="https://example.com/b">y</a>');
			expect(parser.parse('[url="javascript:alert(1)"]x[/url]')).toBe('<a href="#">x</a>');
		}
	});

	it('keep spaces, = and the other kind of quote inside them', () => {
		expect(capture('[item="Bob said x=5" post=12]')).toEqual(['Bob said x=5', { post: '12' }]);
		expect(capture('[item=\'Name\' pid=\'12\' alt="it\'s"]')).toEqual(['Name', { pid: '12', alt: 'it&#39;s' }]);
		expect(capture('[item=Bob\'s mum]')).toEqual(['Bob&#39;s mum', {}]);
	});

	it('can hold ], since forum names like [Lusk]-Lynge do', () => {
		const parser = new yabbc();
		expect(parser.parse('[quote="[Lusk]-Lynge"]a[/quote] [quote=\'Na]me\']b[/quote]')).toBe('<blockquote author="[Lusk]-Lynge">a</blockquote> <blockquote author="Na]me">b</blockquote>');
		expect(capture('[item="a]b" post_id=1]')).toEqual(['a]b', { post_id: '1' }]);
		expect(capture('[item="a]b" post_id=1]', { sanitizeHtml: false })).toEqual(['a]b', { post_id: '1' }]);
	});

	it('end the tag at its first ] when the quote never properly closes', () => {
		const parser = new yabbc();
		expect(parser.parse('[quote="Bob]hi "there" friend[/quote] after')).toBe('<blockquote author="&quot;Bob">hi &quot;there&quot; friend</blockquote> after');
		expect(parser.parse('[quote="Bob]hi\n"]x[/quote]')).toBe('<blockquote author="&quot;Bob">hi<br/>&quot;]x</blockquote>');
	});

	// The quote closing the value comes before the first ], so a later "] on the line must not stretch the tag to it
	it('end the tag at its first ] when the value closed before it without a clean break', () => {
		for (const sanitizeHtml of [true, false]) {
			const parser = new yabbc({ sanitizeHtml });
			expect(parser.parse('[quote="Bob" ]He said [b]hi[/b] then [url="https://example.com"]y[/url][/quote]')).toBe('<blockquote author="Bob">He said <strong>hi</strong> then <a href="https://example.com">y</a></blockquote>');
			expect(capture('[item="Bob" pinned]x [url=\'https://example.com\']y[/url]', { sanitizeHtml })).toEqual(['Bob', { pinned: true }]);
		}
	});

	it('let bare words between two key=value words join the first value, as SMF writes names', () => {
		expect(capture('[item author=John Smith link=msg=12 date=3]')).toEqual(['John Smith', { author: 'John Smith', link: 'msg=12', date: '3' }]);
		expect(capture('[item lang=js skip-lint]')).toEqual(['js', { 'lang': 'js', 'skip-lint': true }]);
		expect(capture('[item skip-lint lang=js]')).toEqual(['js', { 'skip-lint': true, 'lang': 'js' }]);
	});
});

describe('Forum quote formats', () => {
	it.each([
		['phpBB', '[quote="John Doe" post_id=1 time=2 user_id=3]', 'John Doe'],
		['phpBB, name without spaces', '[quote=B4dW0lf post_id=8 time=1736080014 user_id=62]', 'B4dW0lf'],
		['XenForo', '[QUOTE="bjf, post: 9611, member: 135"]', 'bjf'],
		['Discourse', '[quote="TakeWalker, post:2, topic:30056, full:true"]', 'TakeWalker'],
		['vBulletin', '[QUOTE=Little Hunter;200016]', 'Little Hunter'],
		['vBulletin 5', '[QUOTE=Little Hunter;n200016]', 'Little Hunter'],
		['vBulletin, quoted name', '[QUOTE="King Of Kings";172380]', 'King Of Kings'],
		['SMF', '[quote author=John Smith link=msg=12 date=1456506357]', 'John Smith'],
		['MyBB', '[quote=\'Name\' pid=\'12\' dateline=\'1700000000\']', 'Name'],
	])('shows just the name for %s', (_engine, tag, author) => {
		expect(new yabbc().parse(`${tag}hi[/quote]`)).toBe(`<blockquote author="${author}">hi</blockquote>`);
	});

	it.each([
		['vBulletin, quoted name', '[QUOTE="King Of Kings";172380]', 'King Of Kings'],
		['XenForo', '[QUOTE="bjf, post: 9611, member: 135"]', 'bjf'],
	])('keeps the rest of the line for %s when a quoted value follows', (_engine, tag, author) => {
		expect(new yabbc().parse(`${tag}hi[/quote] see [url="https://example.com"]this[/url]`)).toBe(`<blockquote author="${author}">hi</blockquote> see <a href="https://example.com">this</a>`);
	});
});

describe('Case-sensitive tag names', () => {
	it('match only as registered, so a capitalized name like [Signal] stays text', () => {
		const parser = new yabbc({ caseSensitive: true });
		parser.registerTag('signal', { type: 'replace', open: (_attr, attrs) => `<s>${Object.keys(attrs)[0]}</s>`, close: null });
		expect(parser.parse('[signal ready] [Signal]')).toBe('<s>ready</s> [Signal]');
	});

	it('keep a raw tag from swallowing the rest of the text after a name like [GDScript]', () => {
		const parser = new yabbc({ caseSensitive: true });
		parser.registerTag('gdscript', { type: 'content', raw: true, replace: (_attr, code) => `<pre>${code}</pre>` });
		expect(parser.parse('a [GDScript] b [b]c[/b] [gdscript][b][/gdscript]')).toBe('a [GDScript] b <strong>c</strong> <pre>[b]</pre>');
	});

	it('only match the built-in tags in lowercase', () => {
		expect(new yabbc({ caseSensitive: true }).parse('[B]x[/B] [b]y[/b]')).toBe('[B]x[/B] <strong>y</strong>');
	});

	it('are off by default', () => {
		const parser = new yabbc();
		parser.registerTag('Shout', { type: 'replace', open: '<em>', close: '</em>' });
		expect(parser.parse('[B]x[/B] [shout]y[/SHOUT]')).toBe('<strong>x</strong> <em>y</em>');
	});
});

describe('Numbered lists', () => {
	it('render [list=1], [list=a] and the like as ordered lists', () => {
		const parser = new yabbc();
		expect(parser.parse('[list=1][*]a[/list][list=a][*]b[/list][list=I][*]c[/list]')).toBe('<ol type="1"><li>a</li></ol><ol type="a"><li>b</li></ol><ol type="I"><li>c</li></ol>');
		expect(parser.parse('[list=disc][*]d[/list]')).toBe('<ul><li>d</li></ul>');
	});
});

describe('Escaping helpers', () => {
	it('make custom tags safe without escaping text twice', () => {
		for (const sanitizeHtml of [true, false]) {
			const parser = new yabbc({ sanitizeHtml });
			parser.registerTag('link', {
				type: 'replace',
				open: attr => `<a href="${parser.sanitizeUrl(attr) ?? '#'}" title="${parser.escapeHtml(attr)}">`,
				close: '</a>',
			});
			expect(parser.parse('[link=https://example.com/?a=1&b="2"]x[/link]')).toBe('<a href="https://example.com/?a=1&amp;b=&quot;2&quot;" title="https://example.com/?a=1&amp;b=&quot;2&quot;">x</a>');
			expect(parser.parse('[link=javascript:alert(1)]x[/link]')).toBe('<a href="#" title="javascript:alert(1)">x</a>');
		}
	});

	it('respect allowedSchemes', () => {
		const parser = new yabbc({ allowedSchemes: ['https'] });
		expect(parser.sanitizeUrl('http://example.com')).toBeUndefined();
		expect(parser.sanitizeUrl('https://example.com')).toBe('https://example.com');
		expect(parser.sanitizeUrl('/relative')).toBe('/relative');
	});
});

describe('Benchmark cases', () => {
	it.each(benchCases)('$name renders the expected HTML', ({ input, expected, chOnly }) => {
		const parser = new yabbc();
		if (chOnly) {
			parser.registerTag('ch', { type: 'replace', open: '<div>', close: '</div>' });
		}
		expect(parser.parse(input)).toBe(expected);
	});
});

describe('Linear time', () => {
	// Before parsing became a single pass, each of these took from seconds to minutes or overflowed the stack
	const caseVariants = Array.from({ length: 20000 }, (_, index) => {
		const letters = [...'abcdefghijklmnop'].map((letter, bit) => (index & (1 << bit) ? letter.toUpperCase() : letter));
		return `[${letters.join('')}]`;
	}).join('');
	const inputs: [string, string][] = [
		['open brackets', '['.repeat(200000)],
		['open brackets before a caret', `${'['.repeat(200000)}^]`],
		['unclosed tags and stray closing tags', '[b]'.repeat(50000) + '[/i]'.repeat(50000)],
		['unclosed list items', `[list]${'[*] item\n'.repeat(50000)}[/list]`],
		['images', '[img]https://example.com/a.png[/img]'.repeat(50000)],
		['case variants of one unclosed tag', caseVariants],
		['quoted values that never close', '[quote="a]'.repeat(50000)],
		['quoted values holding ]', '[quote="a]b"]x'.repeat(50000)],
		['apostrophes between tags', '[b]it\'s[/b] [i=\'x]'.repeat(50000)],
		['a long run of spaces before an =', `[quote=b${' '.repeat(200000)}=]x[/quote]`],
		['a long run of spaces after a quoted value', `[quote="a]"${' '.repeat(200000)}b]x[/quote]`],
		['nested url tags linking to their text', `${'[url]'.repeat(50000)}&x${'[/url]'.repeat(50000)}`],
		['nested url tags that each start like a URL', `${'[url]a:'.repeat(50000)}${'[/url]'.repeat(50000)}`],
		['quoted values closed before a ] with a "] later on the line', '[quote="a" ]x [b="y"]z'.repeat(50000)],
	];

	it.each(inputs)('parses %s without slowing down as they grow', (_name, input) => {
		const start = performance.now();
		new yabbc().parse(input);
		expect(performance.now() - start).toBeLessThan(2000);
	});
});
