export = yabbcode

declare class yabbcode {
	/**
	 * Create a new bbcode parser
	 */
	constructor()
	/**
	 * Parse bbcode
	 * @param bbc bbcode to parse
	 */
	parse(bbc: string): string
	/**
	 * Remove all default or registered tags
	 */
	clearTags(): this
	/**
	 * Add custom tags
	 * @param tag tag name
	 * @param options options to parse the tag
	 */
	registerTag(tag: string, options: {
		type: string
		open: ((attr: string) => string) | string
		close: ((attr: string) => string) | string
	}): this
}