import { describe, expectTypeOf, it } from 'vitest';

import yabbcode, {
	type Config,
	type ContentTag,
	type IgnoreTag,
	type ReplaceTag,
	type TagDefinition,
} from '../src/ya-bbcode';

describe('Type exports', () => {
	it('should export Config type correctly', () => {
		const config: Config = {
			newline: true,
			paragraph: false,
			cleanUnmatchable: true,
			sanitizeHtml: false,
			allowedSchemes: ['http', 'https'],
		};
		expectTypeOf(config).toEqualTypeOf<Config>();

		// All properties should be optional
		const emptyConfig: Config = {};
		expectTypeOf(emptyConfig).toEqualTypeOf<Config>();

		// allowedSchemes should be string array
		const configWithSchemes: Config = {
			allowedSchemes: ['https', 'mailto'],
		};
		expectTypeOf(configWithSchemes).toEqualTypeOf<Config>();
	});

	it('should export ReplaceTag type correctly', () => {
		// With string open/close
		const stringTag: ReplaceTag = {
			type: 'replace',
			open: '<b>',
			close: '</b>',
		};
		expectTypeOf(stringTag).toEqualTypeOf<ReplaceTag>();

		// With function open/close
		const funcTag: ReplaceTag = {
			type: 'replace',
			open: attr => `<a href="${attr}">`,
			close: () => '</a>',
		};
		expectTypeOf(funcTag).toEqualTypeOf<ReplaceTag>();

		// With null close
		const nullCloseTag: ReplaceTag = {
			type: 'replace',
			open: '<li>',
			close: null,
		};
		expectTypeOf(nullCloseTag).toEqualTypeOf<ReplaceTag>();
	});

	it('should export ContentTag type correctly', () => {
		// With function replace
		const funcTag: ContentTag = {
			type: 'content',
			replace: (attr, content) => `<img src="${content}" alt="${attr}"/>`,
		};
		expectTypeOf(funcTag).toEqualTypeOf<ContentTag>();

		// With string replace
		const stringTag: ContentTag = {
			type: 'content',
			replace: 'Nodecraft',
		};
		expectTypeOf(stringTag).toEqualTypeOf<ContentTag>();
	});

	it('should export IgnoreTag type correctly', () => {
		const ignoreTag: IgnoreTag = {
			type: 'ignore',
		};
		expectTypeOf(ignoreTag).toEqualTypeOf<IgnoreTag>();
	});

	it('should export TagDefinition union type correctly', () => {
		const replaceTag: ReplaceTag = {
			type: 'replace',
			open: '<b>',
			close: '</b>',
		};
		expectTypeOf<TagDefinition>().toEqualTypeOf<ReplaceTag | ContentTag | IgnoreTag>();
		expectTypeOf(replaceTag).toEqualTypeOf<ReplaceTag>();

		const contentTag: ContentTag = {
			type: 'content',
			replace: (_attr, content) => content,
		};
		expectTypeOf(contentTag).toEqualTypeOf<ContentTag>();

		const ignoreTag: IgnoreTag = {
			type: 'ignore',
		};
		expectTypeOf(ignoreTag).toEqualTypeOf<IgnoreTag>();
	});

	it('should allow constructing yabbcode with config', () => {
		const parser = new yabbcode({ newline: false });
		expectTypeOf(parser).toBeObject();
		expectTypeOf(parser.parse).toBeFunction();
		expectTypeOf(parser.registerTag).toBeFunction();
		expectTypeOf(parser.clearTags).toBeFunction();
	});

	it('should type check registerTag method', () => {
		const parser = new yabbcode();

		// Should accept string tag name and TagDefinition
		expectTypeOf(parser.registerTag).toBeCallableWith('url', {
			type: 'replace',
			open: '<a>',
			close: '</a>',
		});

		expectTypeOf(parser.registerTag).toBeCallableWith('img', {
			type: 'content',
			replace: (_attr, content) => `<img src="${content}"/>`,
		});

		expectTypeOf(parser.registerTag).toBeCallableWith('noparse', {
			type: 'ignore',
		});

		// Should return this for chaining
		expectTypeOf(parser.registerTag('test', { type: 'ignore' })).toEqualTypeOf(parser);
	});

	it('should type check parse method', () => {
		const parser = new yabbcode();

		// Should accept string, number, or boolean
		expectTypeOf(parser.parse).toBeCallableWith('[b]test[/b]');
		expectTypeOf(parser.parse).toBeCallableWith(123);
		expectTypeOf(parser.parse).toBeCallableWith(true);

		// Should return string
		expectTypeOf(parser.parse('[b]test[/b]')).toBeString();
	});

	it('should type check clearTags method', () => {
		const parser = new yabbcode();

		// Should return this for chaining
		expectTypeOf(parser.clearTags()).toEqualTypeOf(parser);
	});
});
