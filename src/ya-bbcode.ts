// Type definitions
interface Config {
	newline?: boolean;
	paragraph?: boolean;
	cleanUnmatchable?: boolean;
	sanitizeHtml?: boolean;
	allowedSchemes?: string[];
}

// Parsed attributes from tags like [code lang=javascript skip-lint]
interface TagAttributes {
	[key: string]: string | boolean;
}

interface ReplaceTag {
	type: 'replace';
	open: ((attr: string, attrs: TagAttributes) => string) | string;
	close: ((attr: string, attrs: TagAttributes) => string) | string | null;
}

interface ContentTag {
	type: 'content';
	replace: ((attr: string, content: string, attrs: TagAttributes) => string) | string;
}

interface IgnoreTag {
	type: 'ignore';
}

type TagDefinition = ReplaceTag | ContentTag | IgnoreTag;

interface TagsMap {
	[key: string]: TagDefinition;
}

interface TagItem {
	index: number;
	module: string;
	raw: string;
	attr: string; // Backward compat: first value or empty
	attrs: TagAttributes; // Parsed attributes
	isClosing: boolean;
	matchTag: number | false | null;
	closing?: TagItem;
	children: TagItem[];
	parent: number | null;
	stackIndex?: number;
}

/**
 * Escapes HTML attribute values to prevent XSS
 * Encodes quotes, angle brackets, and other special characters
 */
function escapeHtmlAttr(value: string): string {
	const attrEntities: { [key: string]: string; } = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		'\'': '&#39;',
	};
	return String(value).replaceAll(/["&'<>]/g, (char: string) => attrEntities[char] || char);
}

/**
 * Validates and sanitizes URLs to prevent javascript: and data: URL attacks
 * Only allows safe URL schemes based on the allowedSchemes list
 */
function sanitizeUrl(url: string, allowedSchemes: string[]): string {
	const trimmed = String(url).trim();
	if (!trimmed) { return '#'; }

	// Allow relative URLs (starting with /, ./, or ../)
	if (/^\.{0,2}\//.test(trimmed)) {
		return trimmed;
	}

	// Allow fragment identifiers
	if (trimmed.startsWith('#')) {
		return trimmed;
	}

	// Check for scheme
	const schemeMatch = /^([a-z][\d+.a-z-]*):/.exec(trimmed.toLowerCase());
	if (schemeMatch) {
		const scheme = schemeMatch[1] ?? '';
		if (!allowedSchemes.includes(scheme)) {
			// Dangerous scheme detected (javascript:, data:, vbscript:, etc.)
			return '#';
		}
	}

	return trimmed;
}

/**
 * Parse tag attributes from a tag string
 * Supports both formats:
 * - [tag=value] → { attr: 'value', attrs: {} }
 * - [tag key=value flag] → { attr: 'value', attrs: { key: 'value', flag: true } }
 */
function parseTagAttributes(tagContent: string): { attr: string; attrs: TagAttributes; } {
	// Check if tag has spaces (space-separated) or = (simple attribute)
	const firstSpace = tagContent.indexOf(' ');
	const firstEquals = tagContent.indexOf('=');

	// Simple attribute format: [tag=value] or [tag] (no attributes)
	if (firstSpace === -1 || (firstEquals !== -1 && firstEquals < firstSpace)) {
		const parts = tagContent.split('=');
		return {
			attr: parts.slice(1).join('='), // Everything after first =
			attrs: {},
		};
	}

	// Space-separated attributes format: [tag attr1 key=value attr2]
	const parts = tagContent.split(/\s+/);
	// Use Object.create(null) to prevent prototype pollution
	const attrs: TagAttributes = Object.create(null) as TagAttributes;
	let firstValue = '';

	// Dangerous keys that could lead to prototype pollution
	const dangerousKeys = new Set(['__proto__', 'constructor', 'prototype']);

	for (let i = 1; i < parts.length; i++) {
		const part = parts[i];
		if (!part) { continue; }

		if (part.includes('=')) {
			const eqIndex = part.indexOf('=');
			const key = part.slice(0, eqIndex);
			const value = part.slice(eqIndex + 1);

			// Prevent prototype pollution
			if (dangerousKeys.has(key.toLowerCase())) {
				continue;
			}

			attrs[key] = value;
			// First key=value becomes the attr for backward compat
			if (!firstValue && value) {
				firstValue = value;
			}
		} else {
			// Boolean flag - also check for dangerous keys
			if (dangerousKeys.has(part.toLowerCase())) {
				continue;
			}
			attrs[part] = true;
		}
	}

	return { attr: firstValue, attrs };
}

class yabbcode {
	tags: TagsMap = {
		'url': {
			type: 'replace',
			open: attr => `<a href="${escapeHtmlAttr(sanitizeUrl(attr, this.config.allowedSchemes ?? ['http', 'https', 'mailto', 'ftp', 'ftps']))}">`,
			close: '</a>',
		},
		'quote': {
			type: 'replace',
			open: attr => `<blockquote author="${escapeHtmlAttr(attr)}">`,
			close: '</blockquote>',
		},
		'b': {
			type: 'replace',
			open: '<strong>',
			close: '</strong>',
		},
		'u': {
			type: 'replace',
			open: '<u>',
			close: '</u>',
		},
		'i': {
			type: 'replace',
			open: '<i>',
			close: '</i>',
		},
		'h1': {
			type: 'replace',
			open: '<h1>',
			close: '</h1>',
		},
		'h2': {
			type: 'replace',
			open: '<h2>',
			close: '</h2>',
		},
		'h3': {
			type: 'replace',
			open: '<h3>',
			close: '</h3>',
		},
		'h4': {
			type: 'replace',
			open: '<h4>',
			close: '</h4>',
		},
		'h5': {
			type: 'replace',
			open: '<h5>',
			close: '</h5>',
		},
		'h6': {
			type: 'replace',
			open: '<h6>',
			close: '</h6>',
		},
		'code': {
			type: 'replace',
			open: '<code>',
			close: '</code>',
		},
		'strike': {
			type: 'replace',
			open: '<span class="yabbcode-strike">',
			close: '</span>',
		},
		'spoiler': {
			type: 'replace',
			open: '<span class="yabbcode-spoiler">',
			close: '</span>',
		},
		'list': {
			type: 'replace',
			open: '<ul>',
			close: '</ul>',
		},
		'olist': {
			type: 'replace',
			open: '<ol>',
			close: '</ol>',
		},
		'*': {
			type: 'replace',
			open: '<li>',
			close: null,
		},
		'img': {
			type: 'content',
			replace: (attr, content) => {
				if (!content) {
					return '';
				}
				return `<img src="${escapeHtmlAttr(content)}" alt="${escapeHtmlAttr(attr)}"/>`;
			},
		},
		'noparse': {
			type: 'ignore',
		},
	};

	regex = {
		tags: /(\[[^\]^]+])/g,
		newline: /\r\n|\r|\n/g,
		placeholders: /\[TAG-[1-9]+]/g,
	};

	config: Config;

	contentModules = {
		replace: (tag: TagItem, module: ReplaceTag, content: string): string => {
			let open = module.open;
			let close = module.close;
			if (typeof(open) === 'function') {
				open = open(tag.attr, tag.attrs);
			}
			if (typeof(close) === 'function') {
				close = close(tag.attr, tag.attrs);
			}
			// do the replace
			if (open && !tag.isClosing) {
				//content = content
				content = content.replace('[TAG-' + tag.index + ']', open);
			}
			if (close && tag.closing) {
				content = content.replace('[TAG-' + tag.closing.index + ']', close);
			}
			return content;
		},
		content: (tag: TagItem, module: ContentTag, content: string): string => {
			if (!tag.closing) { return content; }
			const openTag = '[TAG-' + tag.index + ']';
			const closeTag = '[TAG-' + tag.closing.index + ']';
			const start = content.indexOf(openTag);
			const end = content.indexOf(closeTag);
			let replace = module.replace;

			const innerContent = content.slice(start + openTag.length, end);
			if (typeof(replace) === 'function') {
				replace = replace(tag.attr, innerContent, tag.attrs);
			}

			const contentStart = content.slice(0, Math.max(0, start));
			const contentEnd = content.slice(end + closeTag.length);

			return contentStart + replace + contentEnd;
		},
		ignore: (tag: TagItem, _module: IgnoreTag, content: string): string => {
			const openTag = '[TAG-' + tag.index + ']';
			const start = content.indexOf(openTag);
			let closeTag = '';
			let end = content.length;
			if (tag.closing) {
				closeTag = '[TAG-' + tag.closing.index + ']';
				end = content.indexOf(closeTag);
			}
			let innerContent = content.slice(start + openTag.length, end);
			innerContent = this.#ignoreLoop(tag.children, innerContent);
			const contentStart = content.slice(0, Math.max(0, start));
			const contentEnd = content.slice(end + closeTag.length);
			return contentStart + innerContent + contentEnd;
		},
	};

	constructor(config: Config = {}) {
		this.config = {
			newline: true,
			paragraph: false,
			cleanUnmatchable: true,
			sanitizeHtml: true,
			allowedSchemes: ['http', 'https', 'mailto', 'ftp', 'ftps'],
		};
		if (config.newline !== undefined) {
			this.config.newline = config.newline;
		}
		if (config.paragraph !== undefined) {
			this.config.paragraph = config.paragraph;
		}
		if (config.cleanUnmatchable !== undefined) {
			this.config.cleanUnmatchable = config.cleanUnmatchable;
		}
		if (config.sanitizeHtml !== undefined) {
			this.config.sanitizeHtml = config.sanitizeHtml;
		}
		if (config.allowedSchemes !== undefined) {
			this.config.allowedSchemes = config.allowedSchemes;
		}
	}

	#ignoreLoop(tagsMap: TagItem[], content: string): string {
		for (const tag of tagsMap) {
			content = content.replace('[TAG-' + tag.index + ']', tag.raw);
			if (tag.closing) {
				content = content.replace('[TAG-' + tag.closing.index + ']', tag.closing.raw);
			}
			if (tag.children.length > 0) {
				content = this.#ignoreLoop(tag.children, content);
			}
		}
		return content;
	}

	#contentLoop(tagsMap: TagItem[], content: string): string {
		// Adaptive threshold: use optimized path for large documents (>50 tags)
		// Only optimize when all tags are replace-type (most common case for large docs)
		if (tagsMap.length > 50) {
			// Check if we have any content or ignore type tags
			const hasSpecialTypes = tagsMap.some((tag) => {
				const module = this.tags[tag.module];
				return module && (module.type === 'content' || module.type === 'ignore');
			});

			// If only replace-type tags, use optimized single-pass approach
			if (!hasSpecialTypes) {
				return this.#contentLoopOptimized(tagsMap, content);
			}
		}

		for (const tag of tagsMap) {
			let module = this.tags[tag.module];
			if (!module) {
				// ignore invalid BBCode
				module = {
					type: 'replace',
					open: tag.raw,
					close: tag.closing ? tag.closing.raw : '',
				};
			}
			if (!this.contentModules[module.type]) {
				throw new Error('Cannot parse content block. Invalid block type [' + module.type + '] provided for tag [' + tag.module + ']');
			}
			if (module.type === 'replace') {
				content = this.contentModules.replace(tag, module, content);
			} else if (module.type === 'content') {
				content = this.contentModules.content(tag, module, content);
			} else if (module.type === 'ignore') {
				content = this.contentModules.ignore(tag, module, content);
			}
			if (tag.children.length > 0 && module.type !== 'ignore') {
				content = this.#contentLoop(tag.children, content);
			}
		}

		return content;
	}

	#contentLoopOptimized(tagsMap: TagItem[], content: string): string {
		// Optimized single-pass replacement for replace-type tags only
		// Build replacement map for all placeholders
		const replacements = new Map<string, string>();

		const processTag = (tag: TagItem) => {
			let module = this.tags[tag.module];
			if (!module) {
				module = {
					type: 'replace',
					open: tag.raw,
					close: tag.closing ? tag.closing.raw : '',
				} as ReplaceTag;
			}

			// Only handle replace type (this function is only called when all tags are replace type)
			if (module.type !== 'replace') { return; }

			let open = module.open;
			let close = module.close;
			if (typeof(open) === 'function') {
				open = open(tag.attr, tag.attrs);
			}
			if (typeof(close) === 'function') {
				close = close(tag.attr, tag.attrs);
			}
			if (open && !tag.isClosing) {
				replacements.set('[TAG-' + tag.index + ']', open);
			}
			if (close && tag.closing) {
				replacements.set('[TAG-' + tag.closing.index + ']', close);
			}

			// Process children recursively
			if (tag.children.length > 0) {
				for (const child of tag.children) {
					processTag(child);
				}
			}
		};

		// Build replacement map for all tags
		for (const tag of tagsMap) {
			processTag(tag);
		}

		// Single-pass replacement using regex
		const placeholderRegex = /\[TAG-(\d+)]/g;
		return content.replaceAll(placeholderRegex, (match: string) => replacements.get(match) || '');
	}

	#tagLoop(tagsMap: TagItem[], parent?: number): TagItem[] {
		// Use stack-based algorithm - O(n) instead of O(n²)
		const stack = [];
		const processed = new Set();

		for (let i = 0; i < tagsMap.length; i++) {
			const tag = tagsMap[i];
			if (!tag) { continue; }

			if (tag.isClosing) {
				// Find matching opening tag on stack (search backwards for proper nesting)
				for (let stackIndex = stack.length - 1; stackIndex >= 0; stackIndex--) {
					const openTag = stack[stackIndex];
					if (!openTag) { continue; }
					if (openTag.module === tag.module && !processed.has(openTag.index)) {
						// Match found
						openTag.matchTag = tag.index;
						openTag.closing = tag;
						tag.matchTag = openTag.index;
						processed.add(openTag.index);

						// Set children for the opening tag
						const childStart = (openTag.stackIndex ?? 0) + 1;
						if (childStart < i) {
							openTag.children = [];
							for (let childIndex = childStart; childIndex < i; childIndex++) {
								const childTag = tagsMap[childIndex];
								if (childTag && !childTag.isClosing && childTag.parent === null) {
									childTag.parent = openTag.index;
									openTag.children.push(childTag);
								}
							}
						}

						// Remove matched opening tag from stack
						stack.splice(stackIndex, 1);
						break;
					}
				}
			} else {
				// Opening tag - add to stack
				tag.stackIndex = i;
				stack.push(tag);
			}
		}

		// Handle unmatched opening tags - assign all remaining tags as children
		for (const tag of stack) {
			tag.matchTag = false;
			const childStart = (tag.stackIndex ?? 0) + 1;
			if (childStart < tagsMap.length) {
				tag.children = [];
				for (let childIndex = childStart; childIndex < tagsMap.length; childIndex++) {
					const childTag = tagsMap[childIndex];
					if (childTag && !childTag.isClosing && childTag.parent === null) {
						childTag.parent = tag.index;
						tag.children.push(childTag);
					}
				}
			}
		}

		// Filter and process recursively
		const result = [];
		for (const tag of tagsMap) {
			if (!tag.isClosing) {
				const shouldInclude = (parent === undefined && tag.parent === null) ||
					(parent !== undefined && tag.parent === parent);
				if (shouldInclude) {
					if (tag.children.length > 0) {
						tag.children = this.#tagLoop(tag.children, tag.index);
					}
					result.push(tag);
				}
			}
		}

		return result;
	}

	clearTags(): this {
		this.tags = {};
		return this;
	}

	registerTag(tag: string, options: TagDefinition): this {
		const tagName = String(tag).toLowerCase();

		// Prevent prototype pollution
		const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
		if (dangerousKeys.includes(tagName)) {
			throw new Error(`Cannot register tag with dangerous name: ${tagName}`);
		}

		this.tags[tagName] = options;
		return this;
	}

	parse(bbcInput: string | number | boolean): string {
		if (
			typeof(bbcInput) === 'boolean'
			|| (typeof(bbcInput) !== 'string' && Number.isNaN(Number(bbcInput)))
		) { return ''; }
		let input = String(bbcInput);
		if (this.config.sanitizeHtml) {
			// Batch HTML entity replacement for better performance
			const htmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' };
			input = input.replaceAll(/["&'<>]/g, (char: string) => htmlEntities[char as keyof typeof htmlEntities]);
		}

		// reset
		let tagsMap: TagItem[] = [];
		// split input into tags by index
		const tags = String(input).match(this.regex.tags);

		if (this.config.newline) {
			if (this.config.paragraph) {
				input = input.replace(this.regex.newline, '</p><p>');
			} else {
				input = input.replace(this.regex.newline, '<br/>');
			}
		}
		if (this.config.paragraph) {
			input = '<p>' + input + '</p>';
		}

		// handle when no tags are present
		if (!tags || tags.length === 0) {
			return input;
		}
		// Build tag map and replace with placeholders
		for (const [i, tag] of tags.entries()) {
			const tagContent = tag.slice(1, -1); // Remove [ ]
			const isClosing = tagContent.startsWith('/');
			const contentToParse = isClosing ? tagContent.slice(1) : tagContent;

			// Parse module name and attributes
			const spaceIndex = contentToParse.indexOf(' ');
			const equalsIndex = contentToParse.indexOf('=');
			let moduleName: string;
			let parsedAttrs: { attr: string; attrs: TagAttributes; };

			// Extract module name (before space or =)
			if (spaceIndex === -1 && equalsIndex === -1) {
				// No attributes: [tag]
				moduleName = contentToParse.toLowerCase();
				parsedAttrs = { attr: '', attrs: {} };
			} else if (spaceIndex === -1 || (equalsIndex !== -1 && equalsIndex < spaceIndex)) {
				// Old format: [tag=value]
				moduleName = (contentToParse.split('=')[0] ?? '').toLowerCase();
				parsedAttrs = parseTagAttributes(contentToParse);
			} else {
				// New format: [tag attr1 key=value]
				moduleName = (contentToParse.split(/\s+/)[0] ?? '').toLowerCase();
				parsedAttrs = parseTagAttributes(contentToParse);
			}

			const item: TagItem = {
				index: i,
				module: moduleName,
				isClosing,
				raw: tag,
				attr: parsedAttrs.attr,
				attrs: parsedAttrs.attrs,
				children: [],
				parent: null,
				matchTag: null,
			};

			tagsMap.push(item);
		}

		// Replace tags with placeholders - optimized for different input sizes
		if (tags.length <= 3) {
			// Fast path for few tags - direct replacement is faster
			for (const [i, tag] of tags.entries()) {
				input = input.replace(tag, '[TAG-' + i + ']');
			}
		} else {
			// Batch replacement for many tags
			const tagPositions = [];
			let lastIndex = 0;
			for (const [i, tag] of tags.entries()) {
				const pos = input.indexOf(tag, lastIndex);
				if (pos !== -1) {
					tagPositions.push({ pos, tag: tag, placeholder: '[TAG-' + i + ']' });
					lastIndex = pos + tag.length;
				}
			}

			if (tagPositions.length > 0) {
				const parts = [];
				let lastPos = 0;
				for (const { pos, tag, placeholder } of tagPositions) {
					parts.push(input.slice(lastPos, pos));
					parts.push(placeholder);
					lastPos = pos + tag.length;
				}
				parts.push(input.slice(lastPos));
				input = parts.join('');
			}
		}
		// loop through each tag to create nested elements
		tagsMap = this.#tagLoop(tagsMap);
		// put back all non-found matches?
		input = this.#contentLoop(tagsMap, input);
		if (this.config.cleanUnmatchable) {
			input = input.replace(this.regex.placeholders, '');
		}
		return input;
	}
}

// Export types for users
export type { Config, TagAttributes, ReplaceTag, ContentTag, IgnoreTag, TagDefinition };

// Default export for both CJS and ESM
export default yabbcode;
