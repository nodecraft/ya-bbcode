'use strict';

const _ = require('lodash');

const yabbc = function(config){
	if(!(this instanceof yabbc)){
		return new yabbc();
	}
	this.config = _.defaults(config, {
		newline: false
	});

	this.regex = {
		tags: /(\[[^\]^\s]{1,}\])/g
	};
};

yabbc.prototype.matchTags = function(){

};


yabbc.prototype.parse = function(bbcInput){
	let input = bbcInput.slice(0); // cheap string clone

	this.tagsMap = [];
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

		this.tagsMap.push(item);
		input = input.replace(tag, '%s'); // placeholder for tag
	});
	// loop through each tag to create nested elements
	let currentTagIndex = 0;
	while(currentTagIndex < this.tagsMap.length){
		let found = false;
		if(this.tagsMap[currentTagIndex].matchTag !== null || this.tagsMap[currentTagIndex].isClosing){
			currentTagIndex++;
			continue; // already handled this tag / not closing
		}
		this.tagsMap.forEach((item, i) => {
			//console.log(currentTagIndex, item.index, item.matchTag, item.isClosing, item.module, '>', this.tagsMap[currentTagIndex].module);
			if(
				found ||
				this.tagsMap[currentTagIndex].matchTag !== null ||
				item.index === this.tagsMap[currentTagIndex].index ||
				item.matchTag !== null ||
				!item.isClosing ||
				this.tagsMap[currentTagIndex].module !== item.module
			){
				return;
			}
			this.tagsMap[i].matchTag = this.tagsMap[currentTagIndex].index;
			this.tagsMap[currentTagIndex].matchTag = item.index;
			found = true; // next index
		});
		if(found){
			// sweep children
			let childStart = this.tagsMap[currentTagIndex].index + 1,
				childEnd = this.tagsMap[currentTagIndex].matchTag - 1;
			this.tagsMap[currentTagIndex].children = this.tagsMap.slice(childStart, childEnd);
			this.tagsMap[currentTagIndex].closing = this.tagsMap[this.tagsMap[currentTagIndex].matchTag];

			let i = childStart;
			while(i < childEnd){
				this.tagsMap[i].parent = this.tagsMap[currentTagIndex].index;
				i++;
			}
		}else{
			this.tagsMap[currentTagIndex].matchTag = false;
		}
		currentTagIndex++; // move on
	}

	// sweep children
	_.remove(this.tagsMap, (item) => {
		return item.parent !== null || item.isClosing;
	});
	// put back all non-found matches?
	return this.tagsMap;
};

module.exports = yabbc;