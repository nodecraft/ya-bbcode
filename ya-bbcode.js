'use strict';

const yabbcode = function(config = {}){
	if(!(this instanceof yabbcode)){
		return new yabbcode();
	}
	let self = this;
	this.config = {
		newline: true
	};
	if(config.newline !== undefined){
		this.config = config.newline;
	}

	this.tags = {
		'url': {
			type: 'replace',
			open: (attr) => {
				return `<a href="${attr || '#'}">`;
			},
			close: '</a>'
		},
		'quote': {
			type: 'replace',
			open: (attr) => {
				return `<blockquote author="${attr || ''}">`;
			},
			close: '</blockquote>'
		},
		'b': {
			type: 'replace',
			open: '<strong>',
			close: '</strong>'
		},
		'u': {
			type: 'replace',
			open: '<u>',
			close: '</u>'
		},
		'i': {
			type: 'replace',
			open: '<i>',
			close: '</u>'
		},
		'h1': {
			type: 'replace',
			open: '<h1>',
			close: '</h1>'
		},
		'h2': {
			type: 'replace',
			open: '<h2>',
			close: '</h2>'
		},
		'h3': {
			type: 'replace',
			open: '<h3>',
			close: '</h3>'
		},
		'h4': {
			type: 'replace',
			open: '<h4>',
			close: '</h4>'
		},
		'h5': {
			type: 'replace',
			open: '<h5>',
			close: '</h5>'
		},
		'h6': {
			type: 'replace',
			open: '<h6>',
			close: '</h6>'
		},
		'code': {
			type: 'replace',
			open: '<code>',
			close: '</code>'
		},
		'strike': {
			type: 'replace',
			open: '<span class="yabbcode-strike">',
			close: '</span>'
		},
		'spoiler': {
			type: 'replace',
			open: '<span class="yabbcode-spoiler">',
			close: '</span>'
		},
		'list': {
			type: 'replace',
			open: '<ul>',
			close: '</ul>'
		},
		'olist': {
			type: 'replace',
			open: '<ol>',
			close: '</ol>'
		},
		'*': {
			type: 'replace',
			open: '<li>',
			close: null
		},
		'img': {
			type: 'content',
			replace: (attr, content) => {
				return `<img src="${content}" alt="${attr || ''}"/>`;
			}
		},
		'noparse': {
			type: 'ignore'
		}
	};
	this.contentModules = {
		replace: (tag, module, content) => {
			let open = module.open,
				close = module.close;
			if(typeof(open) === 'function'){
				open = open(tag.attr);
			}
			if(typeof(close) === 'function'){
				close = open(tag.attr);
			}
			// do the replace
			if(open && !tag.isClosing){
				//content = content
				content = content.replace('[TAG-' + tag.index + ']', open);
			}
			if(close && tag.closing){
				content = content.replace('[TAG-' + tag.closing.index + ']', close);
			}
			return content;
		},
		content: (tag, module, content) => {
			if(!tag.closing){ return content; }
			let openTag = "[TAG-" + tag.index + "]",
				closeTag = "[TAG-" + tag.closing.index + "]";
			let start = content.indexOf(openTag),
				end = content.indexOf(closeTag),
				replace = module.replace;

			let innerContent = content.substr(start + openTag.length, end - (start + openTag.length));
			if(typeof(replace) === 'function'){
				replace = replace(tag.attr, innerContent);
			}

			let contentStart = content.substr(0, start),
				contentEnd = content.substr(end + closeTag.length);

			return contentStart + replace + contentEnd;
		},
		ignore: (tag, module, content) => {
			if(!tag.closing){ return content; }
			let openTag = "[TAG-" + tag.index + "]",
				closeTag = "[TAG-" + tag.closing.index + "]";
			let start = content.indexOf(openTag),
				end = content.indexOf(closeTag);

			let innerContent = content.substr(start + openTag.length, end - (start + openTag.length));

			innerContent = self._ignoreLoop(tag.children, innerContent);

			let contentStart = content.substr(0, start),
				contentEnd = content.substr(end + closeTag.length);

			return contentStart + innerContent + contentEnd;
		}
	};

	this.regex = {
		tags: /(\[[^\]^\s]{1,}\])/g
	};
};
yabbcode.prototype._ignoreLoop = function(tagsMap, content){
	tagsMap.forEach((tag) => {
		content = content.replace('[TAG-' + tag.index + ']', tag.raw);
		if(tag.closing){
			content = content.replace('[TAG-' + tag.closing.index + ']', tag.closing.raw);
		}
		if(tag.children.length){
			this._ignoreLoop(tag.children, content);
		}
	});
	return content;
};

yabbcode.prototype._contentLoop = function(tagsMap, content){
	tagsMap.forEach((tag) => {
		let module = this.tags[tag.module];
		if(!module){
			// ignore invalid BBCode
			module = {
				type: 'replace',
				open: tag.raw,
				close: tag.closing && tag.closing.raw || ''
			};
		}
		if(!this.contentModules[module.type]){
			throw new Error("Cannot parse content block. Invalid block type [" + module.type + "] provided for tag [" + tag.module + "]");
		}
		content = this.contentModules[module.type](tag, module, content);
		if(tag.children.length && tag.module !== 'ignore'){
			content = this._contentLoop(tag.children, content);
		}
	});

	return content;
};

yabbcode.prototype._tagLoop = function(tagsMap, parent){
	let currentTagIndex = 0;
	while(currentTagIndex < tagsMap.length){
		let found = false;
		if(tagsMap[currentTagIndex].matchTag !== null || tagsMap[currentTagIndex].isClosing){
			currentTagIndex++;
			continue; // already handled this tag / not closing
		}
		tagsMap.forEach((item, i) => {
			if(
				found ||
				tagsMap[currentTagIndex].matchTag !== null ||
				item.index === tagsMap[currentTagIndex].index ||
				item.matchTag !== null ||
				!item.isClosing ||
				tagsMap[currentTagIndex].module !== item.module
			){
				return;
			}
			tagsMap[i].matchTag = tagsMap[currentTagIndex].index;
			tagsMap[currentTagIndex].matchTag = item.index;
			found = i; // next index
		});
		if(found !== false){
			// sweep children
			let childStart = currentTagIndex + 1;
			if(childStart < found){
				tagsMap[currentTagIndex].children = tagsMap.slice(childStart, found).map((child) => {
					child.parent = tagsMap[currentTagIndex].index;
					return child;
				});
			}
			tagsMap[currentTagIndex].closing = tagsMap[tagsMap[currentTagIndex].matchTag];

			let i = childStart;
			while(i < found){
				tagsMap[i].parent = tagsMap[currentTagIndex].index;
				i++;
			}
		}else{
			tagsMap[currentTagIndex].matchTag = false;
		}
		currentTagIndex++; // move on
	}

	// sweep children & matched closing tags
	tagsMap = tagsMap.filter((item) => {
		// TODO: make this more readable
		return !((parent === undefined && item.parent !== null) || (item.parent !== null && item.parent !== parent) || item.isClosing);
	});

	return tagsMap.map((tag) => {
		if(tag.children.length){
			tag.children = this._tagLoop(tag.children, tag.index);
		}
		return tag;
	});
};

yabbcode.prototype.clearTags = function(){
	this.tags = {};
	return this;
};

yabbcode.prototype.registerTag = function(tag, options){
	this.tags[String(tag).toLowerCase()] = options;
	return this;
};

yabbcode.prototype.parse = function(bbcInput){
	let input = bbcInput.slice(0); // cheap string clone

	// reset
	let tagsMap = [];
	// split input into tags by index
	let tags = String(input).match(this.regex.tags);
	tags.forEach((tag, i) => {
		let parts = tag.slice(1, -1).split('=');
		let item = {
			index: i,
			module: parts[0].toLowerCase(),
			isClosing: tag.slice(1, 2) === '/',
			raw: tag,
			attr: parts[1],
			closing: null,
			children: [],
			parent: null,
			matchTag: null
		};
		if(item.isClosing){
			item.module = item.module.slice(1);
		}

		tagsMap.push(item);
		input = input.replace(tag, '[TAG-' + i + ']'); // placeholder for tag
	});
	// loop through each tag to create nested elements
	tagsMap = this._tagLoop(tagsMap);
	// put back all non-found matches?

	input = this._contentLoop(tagsMap, input);
	if(this.config.newline){
		input = input.replace(/(?:\r\n|\r|\n)/g, "<br/>");
	}
	return input;
};

module.exports = yabbcode;