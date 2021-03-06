'use strict';
const ava = require('ava');
const yabbc = require('./ya-bbcode.js');

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
	'nodecraft_url': '[nodecraft-url][/nodecraft-url]',
	'pre': '[pre]Minecraft is a really fun game![/pre]',
	'quote': '[quote=Nodecraft]Game Servers Done Right![/quote]',
	'quote_no_attr': '[quote]Game Servers Done Right![/quote]',
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
	'list': "[list][*] Minecraft Servers[*] ARK Servers[*] PixARK Servers[*] Rust Servers[/list]",
	'olist': '[olist][*] Pick your games[*] Create your bot[*] Get ingame![/olist]',
	'img': '[img=Nodecraft]https://nodecraft.com/assets/images/logo.png[/img]',
	'img_no_attr': '[img]https://nodecraft.com/assets/images/logo.png[/img]',
	'img_invalid': '[img][/img]',
	'noparse': '[noparse][img]https://nodecraft.com/assets/images/logo.png[/img][/noparse]',
	'noparse_nested': '[noparse][url=https://nodecraft.com][img]https://nodecraft.com/assets/images/logo.png[/img][/url][/noparse]',
	'noparse_unclosed': '[noparse][img]https://nodecraft.com/assets/images/logo.png[/img]',
	'newline': newlineTest,
	'newline_notag': newlineNoTagTest
};

ava('Bad yabbc instance', (test) => {
	test.is(yabbc().parse(bbcodes.none), bbcodes.none);
});
ava('No BBCode', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.none), bbcodes.none);
});
ava('Invalid BBCode / tags', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.invalid), bbcodes.invalid);
});
ava('BBCode ordering test', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.ordering), '<blockquote author="[b">text</blockquote>');
});
ava('Nested BBCode', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.nested), '<a href="https://nodecraft.com"><img src="https://nodecraft.com/assets/images/logo.png" alt=""/></a>');
});
ava('Deep Nested BBCode', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.nested_deep), '<a href="https://nodecraft.com"><strong>Game Servers <u><i>Done Right</i></u></strong></a>');
});
ava('Non string input', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.undefined), '');
	test.is(parser.parse(true), '');
	test.is(parser.parse({}), '');
	test.is(parser.parse([]), '');
	test.is(parser.parse(() => {}), '');
	test.is(parser.parse(1), '1');
	test.is(parser.parse(12), '12');
});
ava('Tag: url', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.url), '<a href="https://nodecraft.com">Visit Nodecraft</a>');
	test.is(parser.parse(bbcodes.url_no_attr), '<a href="#">Visit Nodecraft</a>');
});
ava('Tag: quote', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.quote), '<blockquote author="Nodecraft">Game Servers Done Right!</blockquote>');
	test.is(parser.parse(bbcodes.quote_no_attr), '<blockquote author="">Game Servers Done Right!</blockquote>');
});
ava('Tag: b', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.b), '<strong>Game Servers Done Right!</strong>');
});
ava('Tag: u', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.u), '<u>Game Servers Done Right!</u>');
});
ava('Tag: i', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.i), '<i>Game Servers Done Right!</i>');
});
ava('Tags: headers', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.h1), '<h1>Game Servers Done Right!</h1>');
	test.is(parser.parse(bbcodes.h2), '<h2>Game Servers Done Right!</h2>');
	test.is(parser.parse(bbcodes.h3), '<h3>Game Servers Done Right!</h3>');
	test.is(parser.parse(bbcodes.h4), '<h4>Game Servers Done Right!</h4>');
	test.is(parser.parse(bbcodes.h5), '<h5>Game Servers Done Right!</h5>');
	test.is(parser.parse(bbcodes.h6), '<h6>Game Servers Done Right!</h6>');
});
ava('Tag: code', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.code), '<code>new yabbcode();</code>');
});
ava('Tag: strike', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.strike), '<span class="yabbcode-strike">getnodecraft.net</span>');
});
ava('Tag: spoiler', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.spoiler), '<span class="yabbcode-spoiler">The cake is a lie</span>');
});
ava('Tag: list', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.list), '<ul><li> Minecraft Servers<li> ARK Servers<li> PixARK Servers<li> Rust Servers</ul>');
});
ava('Tag: olist', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.olist), '<ol><li> Pick your games<li> Create your bot<li> Get ingame!</ol>');
});
ava('Tag: img', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.img), '<img src="https://nodecraft.com/assets/images/logo.png" alt="Nodecraft"/>');
	test.is(parser.parse(bbcodes.img_no_attr), '<img src="https://nodecraft.com/assets/images/logo.png" alt=""/>');
	test.is(parser.parse(bbcodes.img_invalid), '');
});
ava('Tag: noparse', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.noparse), '[img]https://nodecraft.com/assets/images/logo.png[/img]');
});
ava('Tag: noparse nested', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.noparse_nested), '[url=https://nodecraft.com][img]https://nodecraft.com/assets/images/logo.png[/img][/url]');
});
ava('Tag: noparse unclosed', (test) => {
	const parser = new yabbc();
	test.is(parser.parse(bbcodes.noparse_unclosed), '[img]https://nodecraft.com/assets/images/logo.png[/img]');
});
ava('Custom Tag, all functions', (test) => {
	const parser = new yabbc();
	parser.registerTag('url', {
		type: 'replace',
		open: attr => `<a href="${attr || '#'}" rel="noopener nofollow" target="_blank">`,
		close: () => '</a>'
	});
	test.is(parser.parse(bbcodes.url), '<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft</a>');
});
ava('Custom Tag, all strings', (test) => {
	const parser = new yabbc();
	parser.registerTag('nodecraft-url', {
		type: 'replace',
		open: `<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft`,
		close: '</a>'
	});
	test.is(parser.parse(bbcodes.nodecraft_url), '<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft</a>');
});
ava('Custom Tag, string open', (test) => {
	const parser = new yabbc();
	parser.registerTag('nodecraft-url', {
		type: 'replace',
		open: `<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft`,
		close: () => '</a>'
	});
	test.is(parser.parse(bbcodes.nodecraft_url), '<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft</a>');
});
ava('Custom Tag, string close', (test) => {
	const parser = new yabbc();
	parser.registerTag('nodecraft-url', {
		type: 'replace',
		open: () => `<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft`,
		close: '</a>'
	});
	test.is(parser.parse(bbcodes.nodecraft_url), '<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft</a>');
});
ava('Custom Tag, content with replace func', (test) => {
	const parser = new yabbc();
	parser.registerTag('pre', {
		type: 'content',
		replace: (attr, content) => `<pre>${content}</pre>`
	});
	test.is(parser.parse(bbcodes.pre), '<pre>Minecraft is a really fun game!</pre>');
});
ava('Custom Tag, content with string replace', (test) => {
	const parser = new yabbc();
	parser.registerTag('brand', {
		type: 'content',
		replace: 'Nodecraft'
	});
	test.is(parser.parse(bbcodes.brand_replace), 'Nodecraft');
});
ava('Custom Tag: Invalid Type', (test) => {
	const parser = new yabbc();
	parser.registerTag('url', {
		type: 'expand',
		open: () => `<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft`,
		close: () => '</a>'
	});
	test.throws(() => {
		parser.parse(bbcodes.url);
	}, {message: /Cannot parse content block/});
});
ava('New line: converted', (test) => {
	const parser = new yabbc({newline: true});
	test.is(parser.parse(bbcodes.newline), '<h1>Nodecraft</h1><br/><strong>Game Servers Done Right</strong>');
});
ava('New line: retained', (test) => {
	const parser = new yabbc({newline: false});
	test.is(parser.parse(bbcodes.newline), '<h1>Nodecraft</h1>\n<strong>Game Servers Done Right</strong>');
});
ava('New line: converted with no tag', (test) => {
	const parser = new yabbc({newline: true});
	test.is(parser.parse(bbcodes.newline_notag), 'Nodecraft<br/>Game Servers Done Right');
});
ava('Paragraph: enabled', (test) => {
	const parser = new yabbc({newline: true, paragraph: true});
	test.is(parser.parse(bbcodes.newline), '<p><h1>Nodecraft</h1></p><p><strong>Game Servers Done Right</strong></p>');
});
ava('Clean unmatchable: cleaned', (test) => {
	const parser = new yabbc({cleanUnmatchable: true});
	test.is(parser.parse(bbcodes.unmatchable), '<strong>Game Servers Done Right!</strong>');
});
ava('Clean unmatchable: retained', (test) => {
	const parser = new yabbc({cleanUnmatchable: false});
	test.is(parser.parse(bbcodes.unmatchable), '<strong>Game Servers Done Right![TAG-1]</strong>');
});
ava('Clear tags', (test) => {
	const parser = new yabbc();
	parser.clearTags();
	test.is(parser.parse(bbcodes.b), '[b]Game Servers Done Right![/b]');
});
