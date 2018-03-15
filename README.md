# ya-bbcode.js
Yet another BBCode parser.

## Usage

```javascript

	let yabbcode = require('ya-bbcode');
	let parser = new yabbcode();
	
	let bbc = '[url=https://nodecraft.com]Visit Nodecraft[/url]';

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

### Why another BBCode Parser?
 - Supports nested BBCode
 - Has no dependencies
 - All BBCode is replaced in a nested format, meaning that parent nodes are parsed before children.
 - Allows custom tags to be replaced or added.

#### Roadmap
 - Performance improvements
 - Clean code up for improved readability
 - Improve docs
 - Add unit tests