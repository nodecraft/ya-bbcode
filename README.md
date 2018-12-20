# ya-bbcode
Yet another BBCode parser.
`npm install ya-bbcode --save`

[![npm version](https://badge.fury.io/js/ya-bbcode.svg)](https://badge.fury.io/js/ya-bbcode)
[![dependencies Status](https://david-dm.org/nodecraft/ya-bbcode/status.svg)](https://david-dm.org/nodecraft/ya-bbcode)
[![Build Status](https://travis-ci.org/nodecraft/ya-bbcode.svg?branch=master)](https://travis-ci.org/nodecraft/ya-bbcode)
[![Coverage Status](https://coveralls.io/repos/github/nodecraft/ya-bbcode/badge.svg)](https://coveralls.io/github/nodecraft/ya-bbcode)

## Usage

```javascript
const yabbcode = require('ya-bbcode');
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
