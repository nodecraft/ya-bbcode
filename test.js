'use strict';
const ava = require('ava'),
	yabbc = require('./ya-bbcode.js');

let bbcodes = {
	'none': 'Nodecraft Game servers',
	'basic': '[url=https://nodecraft.com]Visit Nodecraft[/url]',
	'nested': '[url=https://nodecraft.com][img]https://nodecraft.com/assets/images/logo.png[/img][/url]',
	'nested_deep': '[url=https://nodecraft.com][b]Game Servers [u][i]Done Right[/i][/u][/b][/url]',
};

ava.test('No BBCode', (t) => {
	let parser = new yabbc();
	t.is(parser.parse(bbcodes.none), bbcodes.none);
});

ava.test('Basic BBCode', (t) => {
	let parser = new yabbc();
	t.is(parser.parse(bbcodes.basic), '<a href="https://nodecraft.com">Visit Nodecraft</a>');
});

ava.test('Nested BBCode', (t) => {
	let parser = new yabbc();
	t.is(parser.parse(bbcodes.nested), '<a href="https://nodecraft.com"><img src="https://nodecraft.com/assets/images/logo.png" alt=""/></a>');
});

ava.test('Deep Nested BBCode', (t) => {
	let parser = new yabbc();
	t.is(parser.parse(bbcodes.nested_deep), '<a href="https://nodecraft.com"><strong>Game Servers <u><i>Done Right</i></u></strong></a>');
});

ava.test('Custom Tag', (t) => {
	let parser = new yabbc();
	parser.registerTag('url', {
		type: 'replace',
		open: (attr) => {
			return `<a href="${attr || '#'}" rel="noopener nofollow" target="_blank">`;
		},
		close: '</a>'
	});
	t.is(parser.parse(bbcodes.basic), '<a href="https://nodecraft.com" rel="noopener nofollow" target="_blank">Visit Nodecraft</a>');
});