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
		// eslint-disable-next-line @typescript-eslint/no-empty-function
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
		expect(parser.parse(bbcodes.list)).toBe('<ul><li> Minecraft Servers<li> ARK Servers<li> PixARK Servers<li> Rust Servers</ul>');
	});
	it('Tag: olist', () => {
		const parser = new yabbc();
		expect(parser.parse(bbcodes.olist)).toBe('<ol><li> Pick your games<li> Create your bot<li> Get ingame!</ol>');
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
		expect(parser.parse(bbcodes.unmatchable)).toBe('<strong>Game Servers Done Right![TAG-1]</strong>');
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
});

describe('Security Tests', () => {
	it('XSS Prevention: javascript: URLs blocked', () => {
		const parser = new yabbc();
		expect(parser.parse('[url=javascript:alert(1)]Click[/url]')).toBe('<a href="#">Click</a>');
		expect(parser.parse('[url=JaVaScRiPt:alert(1)]Click[/url]')).toBe('<a href="#">Click</a>');
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

