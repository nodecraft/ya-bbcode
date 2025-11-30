// Test cases for BBCode parser benchmarks

export const testCases = {
	// Short and simple
	short: '[b]Hello World[/b]',

	// Medium complexity with nesting
	medium: '[quote=John][b]This is important:[/b] [i]Please read carefully[/i][/quote]',

	// Long text with multiple tags
	long: `[h1]Welcome to Our Forum[/h1]
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

	// Complex nested structure
	complex: `[quote=User1]
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

	// Deep nesting
	deepNesting: '[b][i][u][strike][spoiler]Very deeply nested content[/spoiler][/strike][/u][/i][/b]',

	// URL heavy
	urlHeavy: `[url=https://example.com/1]Link 1[/url]
[url=https://example.com/2]Link 2[/url]
[url=https://example.com/3]Link 3[/url]
[url=https://example.com/4]Link 4[/url]
[url=https://example.com/5]Link 5[/url]
[url=https://example.com/6]Link 6[/url]
[url=https://example.com/7]Link 7[/url]
[url=https://example.com/8]Link 8[/url]
[url=https://example.com/9]Link 9[/url]
[url=https://example.com/10]Link 10[/url]`,

	// List heavy
	listHeavy: `[list]
${Array.from({ length: 50 }, (_, i) => `[*] List item ${i + 1} with [b]bold[/b] and [i]italic[/i]`).join('\n')}
[/list]`,
};
