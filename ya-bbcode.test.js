import { describe, expect, it } from 'vitest';

import yabbc from './ya-bbcode';

const newlineTest = `[h1]Nodecraft[/h1]
[b]Game Servers Done Right[/b]`;
const newlineNoTagTest = `Nodecraft
Game Servers Done Right`;

const bbcodes = {
	'none': 'Nodecraft Game servers',
	'invalid': '[Nodecraft]Game servers[/nodecraft]',
	'unclosed': '[strong]Nodecraft [b]Game servers[/b]',
	'unmatchable': '[b]Game Servers Done Right![img][/b]',
	'ordering': '[quote=[b]text[/b][/quote]',
	'nested': '[url=https://nodecraft.com][img]https://nodecraft.com/assets/images/logo.png[/img][/url]',
	'nested_deep': '[url=https://nodecraft.com][b]Game Servers [u][i]Done Right[/i][/u][/b][/url]',
	'url': '[url=https://nodecraft.com]Visit Nodecraft[/url]',
	'url_no_attr': '[url]Visit Nodecraft[/url]',
	'url_with_query': '[url=https://nodecraft.com?foobar=foo]Visit Nodecraft[/url]',
	'nodecraft_url': '[nodecraft-url][/nodecraft-url]',
	'pre': '[pre]Minecraft is a really fun game![/pre]',
	'quote': '[quote=Nodecraft]Game Servers Done Right![/quote]',
	'quote_no_attr': '[quote]Game Servers Done Right![/quote]',
	'quote_with_space_in_attr': '[quote=Some user]Game Servers Done Right![/quote]',
	'brand_replace': '[brand][/brand]',
	'b': '[b]Game Servers Done Right![/b]',
	'u': '[u]Game Servers Done Right![/u]',
	'i': '[i]Game Servers Done Right![/i]',
	'h1': '[h1]Game Servers Done Right![/h1]',
	'h2': '[h2]Game Servers Done Right![/h2]',
	'h3': '[h3]Game Servers Done Right![/h3]',
	'h4': '[h4]Game Servers Done Right![/h4]',
	'h5': '[h5]Game Servers Done Right![/h5]',
	'h6': '[h6]Game Servers Done Right![/h6]',
	'code': '[code]new yabbcode();[/code]',
	'strike': '[strike]getnodecraft.net[/strike]',
	'spoiler': '[spoiler]The cake is a lie[/spoiler]',
	'list': '[list][*] Minecraft Servers[*] ARK Servers[*] PixARK Servers[*] Rust Servers[/list]',
	'olist': '[olist][*] Pick your games[*] Create your bot[*] Get ingame![/olist]',
	'img': '[img=Nodecraft]https://nodecraft.com/assets/images/logo.png[/img]',
	'img_no_attr': '[img]https://nodecraft.com/assets/images/logo.png[/img]',
	'img_invalid': '[img][/img]',
	'noparse': '[noparse][img]https://nodecraft.com/assets/images/logo.png[/img][/noparse]',
	'noparse_nested': '[noparse][url=https://nodecraft.com][img]https://nodecraft.com/assets/images/logo.png[/img][/url][/noparse]',
	'noparse_unclosed': '[noparse][img]https://nodecraft.com/assets/images/logo.png[/img]',
	'newline': newlineTest,
	'newline_notag': newlineNoTagTest,
	'html': '<strong>Nodecraft</strong>',
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
		expect(parser.parse(bbcodes.undefined)).toBe('');
		expect(parser.parse(true)).toBe('');
		expect(parser.parse({})).toBe('');
		expect(parser.parse([])).toBe('');
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
			replace: (attr, content) => `<pre>${content}</pre>`,
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
});

