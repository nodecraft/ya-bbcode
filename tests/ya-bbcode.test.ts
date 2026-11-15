import { describe, expect, it } from 'vitest';

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
		expect(parser.parse(bbcodes.newline)).toBe('<h1>Nodecraft</h1><br/><strong>Game Servers Done Right</strong>');
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
	it('Batch replacement path (>3 tags)', () => {
		const parser = new yabbc();
		// Test with 5 tags to trigger batch replacement path
		const input = '[b]one[/b] [i]two[/i] [u]three[/u]';
		expect(parser.parse(input)).toBe('<strong>one</strong> <i>two</i> <u>three</u>');
	});
	it('Optimized path (>50 tags)', () => {
		const parser = new yabbc();
		// Create input with >50 tags (26 pairs = 52 tags) to trigger optimized path
		// Must be all replace-type tags to trigger optimization
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
		// >50 top-level replace tags would otherwise trigger the optimized path,
		// which must not skip autoClose on nested [*] items.
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
		expect(parser.parse('[img][quote=x onerror=alert(1)]y[/quote][/img]')).toBe('<img src="&lt;blockquote author=&quot;x onerror=alert(1)&quot;&gt;y&lt;/blockquote&gt;" alt=""/>');
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

	it('Prototype Pollution Prevention: registerTag blocks dangerous names', () => {
		const parser = new yabbc();
		expect(() => parser.registerTag('__proto__', { type: 'ignore' })).toThrow('Cannot register tag with dangerous name');
		expect(() => parser.registerTag('constructor', { type: 'ignore' })).toThrow('Cannot register tag with dangerous name');
		expect(() => parser.registerTag('prototype', { type: 'ignore' })).toThrow('Cannot register tag with dangerous name');
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
		// >50 top-level tags takes the optimized path, which must follow the same rule
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
			expect(parser.parse('[quote=a" onmouseover="x]hi[/quote]')).toBe('<blockquote author="a&quot; onmouseover=&quot;x">hi</blockquote>');
			expect(parser.parse('[img]a" onerror="x[/img]')).toBe('<img src="a&quot; onerror=&quot;x" alt=""/>');
		}
	});

	it('does not expand $ replacement patterns from attributes', () => {
		const parser = new yabbc();
		expect(parser.parse('[url=x onmouseover=alert(1)]z[/url][quote=$`]a[/quote]')).toBe('<a href="x onmouseover=alert(1)">z</a><blockquote author="$`">a</blockquote>');
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
