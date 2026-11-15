// Test cases for BBCode parser benchmarks
import stub from './stub.ts';

export interface BenchCase {
	name: string;
	input: string;
	// Exact HTML ya-bbcode must produce, so a parser that got faster by dropping work fails the run instead of winning it
	expected: string;
	// Limits every parser to one custom [ch] tag, as BBob's own benchmark does
	chOnly?: boolean;
}

function escapeHtml(text: string): string {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll('\'', '&#39;');
}

function numbered<T>(count: number, build: (number: number) => T): T[] {
	return Array.from({ length: count }, (_, index) => build(index + 1));
}

const plainText = `Welcome back to the weekly community update. It's been a busy few days for the team, and there's a lot to cover.

First, the scheduled maintenance window went smoothly: every region was back online within the hour, and nobody lost any data. Thanks for bearing with us while we swapped out the old hardware.

Second, we're still looking for volunteers to help moderate the forums. If you've been around for a while and don't mind reading a lot of posts, send one of the admins a message.

That's all for this week. See you in game!`;

const htmlHeavy = numbered(12, number => `<div class="post" data-id='${number}'>Tom & Jerry's "guide" says 5 > 3 && 2 < 4 <b>bold</b></div>`).join('\n');

const guideSection = (number: number): string => `[h1]Chapter ${number}: Getting Started[/h1]
[b]Requirements[/b]
[list]
[*] A copy of the game ([url=https://store.example.com/app/${number}]store page[/url])
[*] At least [u]4 GB[/u] of RAM
[*] Patience & a [i]good[/i] connection
[/list]
[img=Overview ${number}]https://cdn.example.com/guides/${number}/overview.png[/img]
[quote=Player ${number}]This saved me hours, thanks![/quote]
[code]
server.cfg -> maxplayers=${number}
[/code]
[noparse][b]not bold[/b][/noparse]
[hr][/hr]`;

// Block tags drop the newline on each side of them, so only newlines between inline content become <br/>
const guideSectionHtml = (number: number): string => `<h1>Chapter ${number}: Getting Started</h1>`
	+ '<strong>Requirements</strong>'
	+ '<ul>'
	+ `<li> A copy of the game (<a href="https://store.example.com/app/${number}">store page</a>)</li>`
	+ '<li> At least <u>4 GB</u> of RAM</li>'
	+ '<li> Patience &amp; a <i>good</i> connection</li>'
	+ '</ul>'
	+ `<img src="https://cdn.example.com/guides/${number}/overview.png" alt="Overview ${number}"/>`
	+ `<blockquote author="Player ${number}">This saved me hours, thanks!</blockquote>`
	+ `<code><br/>server.cfg -&gt; maxplayers=${number}<br/></code><br/>`
	+ '[b]not bold[/b]'
	+ '<hr/>';

const noparseBody = numbered(30, number => `[b]bold ${number}[/b] [url=https://example.com/${number}]link[/url] [*] item`).join('\n');

export const benchCases: BenchCase[] = [
	{
		name: 'Short (Simple Bold)',
		input: '[b]Hello World[/b]',
		expected: '<strong>Hello World</strong>',
	},
	{
		name: 'Medium (Nested Quote)',
		input: '[quote=John][b]This is important:[/b] [i]Please read carefully[/i][/quote]',
		expected: '<blockquote author="John"><strong>This is important:</strong> <i>Please read carefully</i></blockquote>',
	},
	{
		name: 'Long (Forum Post)',
		input: `[h1]Welcome to Our Forum[/h1]
[quote=Admin]
Welcome everyone! Here are the [b]forum rules[/b]:
[list]
[*] Be respectful to other members
[*] No spam or advertising
[*] Stay on topic
[*] Use appropriate language
[/list]
[/quote]

[h2]Getting Started[/h2]
To get started, please [url=https://example.com/profile]create your profile[/url] and introduce yourself.

[code]
function hello() {
  console.log("Hello from the forum!");
}
[/code]

[spoiler]This is a hidden message that only shows when you click[/spoiler]`,
		expected: '<h1>Welcome to Our Forum</h1>'
			+ '<blockquote author="Admin">'
			+ 'Welcome everyone! Here are the <strong>forum rules</strong>:'
			+ '<ul>'
			+ '<li> Be respectful to other members</li>'
			+ '<li> No spam or advertising</li>'
			+ '<li> Stay on topic</li>'
			+ '<li> Use appropriate language</li>'
			+ '</ul>'
			+ '</blockquote><br/>'
			+ '<h2>Getting Started</h2>'
			+ 'To get started, please <a href="https://example.com/profile">create your profile</a> and introduce yourself.<br/><br/>'
			+ '<code><br/>function hello() {<br/>  console.log(&quot;Hello from the forum!&quot;);<br/>}<br/></code><br/><br/>'
			+ '<span class="yabbcode-spoiler">This is a hidden message that only shows when you click</span>',
	},
	{
		name: 'Complex (Deep Nesting)',
		input: `[quote=User1]
[quote=User2]
[quote=User3]
[b]Original message[/b] with [i]nested[/i] [u]formatting[/u]
[/quote]
I agree! Here's my [url=https://example.com]link[/url]
[/quote]
This is getting [strike]complicated[/strike] interesting!
[list]
[*] Point [b]one[/b]
[*] Point [i]two[/i]
[*] Point [u]three[/u]
[/list]
[/quote]`,
		expected: '<blockquote author="User1">'
			+ '<blockquote author="User2">'
			+ '<blockquote author="User3">'
			+ '<strong>Original message</strong> with <i>nested</i> <u>formatting</u>'
			+ '</blockquote>'
			+ 'I agree! Here&#39;s my <a href="https://example.com">link</a>'
			+ '</blockquote>'
			+ 'This is getting <span class="yabbcode-strike">complicated</span> interesting!'
			+ '<ul>'
			+ '<li> Point <strong>one</strong></li>'
			+ '<li> Point <i>two</i></li>'
			+ '<li> Point <u>three</u></li>'
			+ '</ul>'
			+ '</blockquote>',
	},
	{
		name: 'Deep Nesting (5 levels)',
		input: '[b][i][u][strike][spoiler]Very deeply nested content[/spoiler][/strike][/u][/i][/b]',
		expected: '<strong><i><u><span class="yabbcode-strike"><span class="yabbcode-spoiler">Very deeply nested content</span></span></u></i></strong>',
	},
	{
		name: 'URL Heavy (10 links)',
		input: numbered(10, number => `[url=https://example.com/${number}]Link ${number}[/url]`).join('\n'),
		expected: numbered(10, number => `<a href="https://example.com/${number}">Link ${number}</a>`).join('<br/>'),
	},
	{
		name: 'List Heavy (50 items)',
		input: `[list]\n${numbered(50, number => `[*] List item ${number} with [b]bold[/b] and [i]italic[/i]`).join('\n')}\n[/list]`,
		expected: `<ul>${numbered(50, number => `<li> List item ${number} with <strong>bold</strong> and <i>italic</i></li>`).join('')}</ul>`,
	},
	{
		name: 'Image Gallery (12 linked images)',
		input: numbered(12, number => `[url=https://example.com/full/${number}.png][img=Screenshot ${number}]https://example.com/thumb/${number}.png[/img][/url]`).join(' '),
		expected: numbered(12, number => `<a href="https://example.com/full/${number}.png"><img src="https://example.com/thumb/${number}.png" alt="Screenshot ${number}"/></a>`).join(' '),
	},
	{
		name: 'Plain Text (no tags)',
		input: plainText,
		expected: escapeHtml(plainText).replaceAll('\n', '<br/>'),
	},
	{
		name: 'HTML Heavy (escaping)',
		input: htmlHeavy,
		expected: escapeHtml(htmlHeavy).replaceAll('\n', '<br/>'),
	},
	{
		name: 'Noparse Block (90 literal tags)',
		input: `[noparse]${noparseBody}[/noparse]`,
		expected: noparseBody.replaceAll('\n', '<br/>'),
	},
	{
		name: 'Malformed (tag soup)',
		input: `[b]unclosed bold [i]italic[/i] with a stray [/u] closer
[unknown]unknown tag[/unknown] and [color=red]unsupported[/color]
[url]no href[/url] then crossed [b]bold [i]both[/b] italic[/i]
[quote=A "quoted" <name>]escaped attribute[/quote] [ not a tag ] [] [/]
[list][*]one[*]two [img]never closed`,
		expected: '<strong>unclosed bold <i>italic</i> with a stray  closer<br/>'
			+ '[unknown]unknown tag[/unknown] and [color=red]unsupported[/color]<br/>'
			+ '<a href="#">no href</a> then crossed <strong>bold <i>both</strong> italic</i>'
			+ '<blockquote author="A &quot;quoted&quot; &lt;name&gt;">escaped attribute</blockquote> [ not a tag ] [] [/]'
			+ '<ul><li>one</li><li>two never closed',
	},
	{
		name: 'Guide (8 mixed sections)',
		input: numbered(8, guideSection).join('\n'),
		expected: numbered(8, guideSectionHtml).join(''),
	},
	{
		name: 'Large Document (BBob stub)',
		input: stub,
		expected: escapeHtml(stub)
			.replaceAll('[ch]', '<div>')
			.replaceAll('[/ch]', '</div>')
			.replaceAll('\n', '<br/>'),
		chOnly: true,
	},
];
