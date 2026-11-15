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
	/**
	 * HTML to insert when the tag implicitly closes (e.g., before next sibling or parent close).
	 * Useful for tags like [*] that don't have explicit closing tags in BBCode.
	 */
	autoClose?: ((attr: string, attrs: TagAttributes) => string) | string;
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

// What one parse() call knows about a tag name, shared by every tag using it
interface TagKind {
	name: string;
	definition: TagDefinition | undefined;
	// The most recent unclosed tag of this name, so a closing tag finds its partner without searching
	lastOpen: OpenTag | undefined;
}

// The text between a tag's brackets and the kind it names
interface Spelling {
	content: string;
	kind: TagKind;
}

// An opening tag. Closing tags get no object of their own: once paired they are only ever a slot number.
interface OpenTag {
	slot: number;
	// -1 until a closing tag pairs with this one
	closeSlot: number;
	kind: TagKind;
	// Text between the brackets, kept so attributes are only parsed for tags whose definition asks for them
	content: string;
	parent: OpenTag | undefined;
	firstChild: OpenTag | undefined;
	nextSibling: OpenTag | undefined;
	// The unclosed tag of the same name opened before this one, forming a per-name stack without an array per name
	previousOpen: OpenTag | undefined;
	attr: string; // Backward compat: first value or empty
	attrs: TagAttributes | undefined; // Parsed attributes
}

// One parse() call's working state, kept off the instance so a tag function can safely call parse() again
interface Doc {
	input: string;
	// What a newline in text becomes, or undefined when newlines are kept
	lineBreak: string | undefined;
	// Output as [text, slot, text, slot, ..., text]: each tag owns the slot at 2n+1, undefined until something resolves it
	parts: (string | undefined)[];
	// [start, end] offsets of each slot's tag in `input`, so its original text can be restored
	bounds: number[];
	// Positions of the next \n and \r at or after the last text read, remembered so the input is only searched once
	nextLf: number;
	nextCr: number;
	// After the slot in the key, the next part still in use is the text before slot value+1; everything between was folded into a content tag
	skips: Map<number, number> | undefined;
	// Slots a content tag was given as placeholders and did not keep, so nothing may write to them again
	dead: Set<number> | undefined;
}

// NUL is stripped from input so placeholders can't be forged; a distinct end stops `\0 1 \0 2 \0` reading as placeholder 2.
const PLACEHOLDER_START = '\0';
const PLACEHOLDER_END = ';';
const PARAGRAPH_BREAK = '</p><p>';

const newlines = /\r\n|\r|\n/g;
const placeholders = /\0(\d+);/g;
const whitespace = /\s/;
const escapable = /["&'<>]/g;
const tabOrNewline = /[\t\n\r]/;
const relativeUrl = /^\.{0,2}\//;
const schemeName = /^[a-z][\d+.a-z-]*$/;

// Attribute and tag names that would reach Object.prototype
const dangerousKeys = new Set(['__proto__', 'constructor', 'prototype']);

function placeholder(index: number): string {
	return PLACEHOLDER_START + index + PLACEHOLDER_END;
}

// The entity for a character matched by `escapable`
function entityFor(character: string): string {
	switch (character) {
		case '&': {
			return '&amp;';
		}
		case '<': {
			return '&lt;';
		}
		case '>': {
			return '&gt;';
		}
		case '"': {
			return '&quot;';
		}
		default: {
			return '&#39;';
		}
	}
}

/**
 * Escapes text for use in HTML content or attribute values to prevent XSS
 * Encodes quotes, angle brackets, and ampersands
 */
function escapeHtml(value: string): string {
	// test() on a global regex resumes from lastIndex, which walks the matches without a callback or match array for each one
	escapable.lastIndex = 0;
	if (!escapable.test(value)) {
		return value;
	}
	let escaped = '';
	let copied = 0;
	do {
		const index = escapable.lastIndex - 1;
		escaped += value.slice(copied, index) + entityFor(value.charAt(index));
		copied = index + 1;
	} while (escapable.test(value));
	return escaped + value.slice(copied);
}

function unescapeSanitized(value: string): string {
	if (!value.includes('&')) {
		return value;
	}
	// `&amp;` goes last so `&amp;lt;` becomes `&lt;` rather than `<`
	return value
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&#39;', '\'')
		.replaceAll('&amp;', '&');
}

// Mirrors the WHATWG URL parser, which trims C0 controls and spaces and drops tabs/newlines, so `java\tscript:` can't slip through.
function normalizeUrl(url: string): string {
	let start = 0;
	let end = url.length;
	// Comparing against ' ' matches every character from U+0000 to U+0020
	while (start < end && url.charAt(start) <= ' ') {
		start++;
	}
	while (end > start && url.charAt(end - 1) <= ' ') {
		end--;
	}
	const trimmed = url.slice(start, end);
	if (!tabOrNewline.test(trimmed)) {
		return trimmed;
	}
	return trimmed.replaceAll(/[\t\n\r]/g, '');
}

const defaultAllowedSchemes = ['http', 'https', 'mailto', 'ftp', 'ftps'];

/**
 * Validates and sanitizes URLs to prevent javascript: and data: URL attacks
 * Only allows safe URL schemes based on the allowedSchemes list
 * Returns undefined for empty or disallowed URLs
 */
function sanitizeUrl(url: string, allowedSchemes: string[]): string | undefined {
	const trimmed = normalizeUrl(String(url));
	if (!trimmed) {
		return undefined;
	}

	// Allow relative URLs (starting with /, ./, or ../)
	if (relativeUrl.test(trimmed)) {
		return trimmed;
	}

	// Allow fragment identifiers
	if (trimmed.startsWith('#')) {
		return trimmed;
	}

	// A scheme is whatever comes before the first colon, when that reads as a scheme name
	const colon = trimmed.indexOf(':');
	if (colon > 0) {
		const scheme = trimmed.slice(0, colon).toLowerCase();
		// The allow list is checked first because it settles nearly every URL without running the regex
		if (!allowedSchemes.includes(scheme) && schemeName.test(scheme)) {
			// Dangerous scheme detected (javascript:, data:, vbscript:, etc.)
			return undefined;
		}
	}

	return trimmed;
}

// The tag name is everything before the first `=` in [tag=value], or before the first whitespace in [tag key=value flag]
function tagName(content: string): string {
	const firstEquals = content.indexOf('=');
	const firstSpace = content.indexOf(' ');
	if (firstSpace === -1 || (firstEquals !== -1 && firstEquals < firstSpace)) {
		if (firstEquals === -1) {
			return content.toLowerCase();
		}
		return content.slice(0, firstEquals).toLowerCase();
	}
	return content.slice(0, content.search(whitespace)).toLowerCase();
}

/**
 * Parse a tag's attributes from the text between its brackets
 * Supports both formats:
 * - [tag=value] → attr: 'value', attrs: {}
 * - [tag key=value flag] → attr: 'value', attrs: { key: 'value', flag: true }
 */
function attributesOf(tag: OpenTag): TagAttributes {
	if (tag.attrs !== undefined) {
		return tag.attrs;
	}
	const content = tag.content;
	const firstSpace = content.indexOf(' ');
	const firstEquals = content.indexOf('=');

	// Simple attribute format: [tag=value] or [tag] (no attributes)
	if (firstSpace === -1 || (firstEquals !== -1 && firstEquals < firstSpace)) {
		if (firstEquals !== -1) {
			// Everything after first =
			tag.attr = content.slice(firstEquals + 1);
		}
		tag.attrs = {};
		return tag.attrs;
	}

	// Space-separated attributes format: [tag attr1 key=value attr2]
	const parts = content.split(/\s+/);
	// Use Object.create(null) to prevent prototype pollution
	const attrs: TagAttributes = Object.create(null) as TagAttributes;

	for (let i = 1; i < parts.length; i++) {
		const part = parts[i];
		if (!part) {
			continue;
		}

		const eqIndex = part.indexOf('=');
		if (eqIndex === -1) {
			// Boolean flag
			if (!dangerousKeys.has(part.toLowerCase())) {
				attrs[part] = true;
			}
			continue;
		}

		const key = part.slice(0, eqIndex);
		if (dangerousKeys.has(key.toLowerCase())) {
			continue;
		}
		const value = part.slice(eqIndex + 1);
		attrs[key] = value;
		// First key=value becomes the attr for backward compat
		if (!tag.attr && value) {
			tag.attr = value;
		}
	}

	tag.attrs = attrs;
	return attrs;
}

function breakLines(text: string, lineBreak: string): string {
	// Passed as literals because a replacement string can carry `$` patterns, which a variable would hide
	if (lineBreak === PARAGRAPH_BREAK) {
		return text.replaceAll(newlines, '</p><p>');
	}
	return text.replaceAll(newlines, '<br/>');
}

// How many newlines one piece of text has spliced in by hand before the rest goes to the regex
const maxSplicedNewlines = 8;

function indexOrEnd(input: string, character: string, from: number): number {
	const index = input.indexOf(character, from);
	if (index === -1) {
		return Infinity;
	}
	return index;
}

// The text between two tags, with newlines converted when the config asks for it
function textBetween(doc: Doc, start: number, end: number): string {
	if (start === end) {
		return '';
	}
	const { input, lineBreak } = doc;
	if (lineBreak === undefined) {
		return input.slice(start, end);
	}
	// Text between tags holds few newlines if any, so they are found with indexOf and spliced by hand: a regex per piece costs more
	let text = '';
	let from = start;
	for (let spliced = 0; ; spliced++) {
		if (doc.nextLf < from) {
			doc.nextLf = indexOrEnd(input, '\n', from);
		}
		if (doc.nextCr < from) {
			doc.nextCr = indexOrEnd(input, '\r', from);
		}
		const newline = Math.min(doc.nextLf, doc.nextCr);
		if (newline >= end) {
			break;
		}
		if (spliced === maxSplicedNewlines) {
			// A long block of lines, such as pasted code, where one regex pass over the rest is the cheaper way
			return text + breakLines(input.slice(from, end), lineBreak);
		}
		text += input.slice(from, newline) + lineBreak;
		from = newline + 1;
		// \r\n is a single newline
		if (doc.nextCr === newline && doc.nextLf === from) {
			from++;
		}
	}
	if (from === start) {
		return input.slice(start, end);
	}
	return text + input.slice(from, end);
}

// A tag exactly as it was written, with its newlines converted to match the text around it
function tagText(doc: Doc, slot: number, escape = false): string {
	let text = doc.input.slice(doc.bounds[slot * 2], doc.bounds[(slot * 2) + 1]);
	if (escape) {
		text = escapeHtml(text);
	}
	const { lineBreak } = doc;
	// Tags rarely span lines, so the regex only runs for the ones that do
	if (lineBreak === undefined || !(text.includes('\n') || text.includes('\r'))) {
		return text;
	}
	return breakLines(text, lineBreak);
}

// Makes every unclaimed tag opened after `parent` its child. They are always the tail of `orphans`, so each tag is moved once.
function adopt(parent: OpenTag, orphans: OpenTag[]): void {
	let first = orphans.length;
	while (first > 0 && (orphans[first - 1] as OpenTag).slot > parent.slot) {
		first--;
	}
	if (first === orphans.length) {
		return;
	}
	parent.firstChild = orphans[first];
	for (let i = first; i < orphans.length; i++) {
		const child = orphans[i] as OpenTag;
		child.parent = parent;
		child.nextSibling = orphans[i + 1];
	}
	orphans.length = first;
}

/**
 * Looks up the kind for the text between a tag's brackets, creating it the first time a name is seen.
 */
function kindOf(kinds: Map<string, TagKind>, tags: TagsMap, content: string): TagKind {
	const name = tagName(content);
	let kind = kinds.get(name);
	if (kind === undefined) {
		// Tag names come from user input, so inherited keys like `constructor` must not resolve to Object.prototype members.
		let definition: TagDefinition | undefined;
		if (Object.hasOwn(tags, name)) {
			definition = tags[name];
		}
		kind = { name, definition, lastOpen: undefined };
		kinds.set(name, kind);
	}
	return kind;
}

// Whether `input` reads `text` at `start`, compared in place so a repeated tag needs no new string
function spells(text: string, input: string, start: number, length: number): boolean {
	if (text.length !== length) {
		return false;
	}
	for (let i = 0; i < length; i++) {
		if (text.codePointAt(i) !== input.codePointAt(start + i)) {
			return false;
		}
	}
	return true;
}

// Size of the table of recently seen spellings, and the longest spelling worth keeping in it
const recentSize = 64;
const recentMaxLength = 16;

/**
 * Finds every tag in one pass, pairs opening and closing tags and links them into a tree.
 * Returns the first top-level tag, or undefined when the input has no opening tag.
 */
function buildTree(doc: Doc, tags: TagsMap): OpenTag | undefined {
	const { input, parts, bounds } = doc;
	const kinds = new Map<string, TagKind>();
	// Documents repeat a few short tags, so the last spelling seen per hash is checked before allocating and hashing a new string
	const recent: (Spelling | undefined)[] = [];
	// Opening tags no parent has claimed yet, in document order
	const orphans: OpenTag[] = [];
	let unclosed = 0;
	// The ignore tag (e.g. noparse) whose contents are currently being skipped as plain text
	let ignoring: TagKind | undefined;
	let textStart = 0;
	let from = 0;
	// Cached positions of the next `]` and `^`, so input like `[[[[` is scanned once rather than once per bracket
	let close = -1;
	let caret = -1;

	// A tag is `[`, one or more characters other than `]` and `^`, then `]`
	for (;;) {
		const open = input.indexOf('[', from);
		if (open === -1) {
			break;
		}
		if (close <= open) {
			close = input.indexOf(']', open + 1);
			if (close === -1) {
				break;
			}
		}
		if (caret <= open) {
			caret = indexOrEnd(input, '^', open + 1);
		}
		if (caret < close) {
			// No bracket before the caret can start a tag either, as each would run into it too
			from = caret + 1;
			continue;
		}
		from = close + 1;
		if (close === open + 1) {
			continue;
		}

		let nameStart = open + 1;
		const isClosing = input.charAt(nameStart) === '/';
		if (isClosing) {
			nameStart++;
		}
		// Tags inside an ignore tag are plain text, so they never get a slot that could pair with a tag outside it
		if (ignoring !== undefined && !isClosing) {
			continue;
		}
		const length = close - nameStart;
		const hash = ((input.codePointAt(nameStart) ?? 0) + ((input.codePointAt(close - 1) ?? 0) * 3) + (length * 7)) % recentSize;
		let spelling = recent[hash];
		if (spelling === undefined || !spells(spelling.content, input, nameStart, length)) {
			const content = input.slice(nameStart, close);
			spelling = { content, kind: kindOf(kinds, tags, content) };
			if (length <= recentMaxLength) {
				recent[hash] = spelling;
			}
		}
		const { content, kind } = spelling;
		if (ignoring !== undefined) {
			if (kind !== ignoring) {
				continue;
			}
			ignoring = undefined;
		}

		const slot = bounds.length / 2;
		parts.push(textBetween(doc, textStart, open), undefined);
		bounds.push(open, close + 1);
		textStart = close + 1;

		if (isClosing) {
			const opener = kind.lastOpen;
			if (opener !== undefined) {
				kind.lastOpen = opener.previousOpen;
				opener.closeSlot = slot;
				unclosed--;
				adopt(opener, orphans);
			}
			continue;
		}

		const tag: OpenTag = {
			slot,
			closeSlot: -1,
			kind,
			content,
			parent: undefined,
			firstChild: undefined,
			nextSibling: undefined,
			previousOpen: kind.lastOpen,
			attr: '',
			attrs: undefined,
		};
		kind.lastOpen = tag;
		unclosed++;
		orphans.push(tag);
		if (kind.definition?.type === 'ignore') {
			ignoring = kind;
		}
	}

	parts.push(textBetween(doc, textStart, input.length));

	// The first tag that never closes takes every unclaimed tag after it as a child
	if (unclosed > 0) {
		let firstUnclosed: OpenTag | undefined;
		for (const kind of kinds.values()) {
			for (let tag = kind.lastOpen; tag !== undefined; tag = tag.previousOpen) {
				if (firstUnclosed === undefined || tag.slot < firstUnclosed.slot) {
					firstUnclosed = tag;
				}
			}
		}
		if (firstUnclosed !== undefined) {
			adopt(firstUnclosed, orphans);
		}
	}

	for (let i = 0; i < orphans.length; i++) {
		(orphans[i] as OpenTag).nextSibling = orphans[i + 1];
	}
	return orphans[0];
}

function resolve(doc: Doc, slot: number, value: string): void {
	if (doc.dead?.has(slot)) {
		return;
	}
	doc.parts[(slot * 2) + 1] = value;
}

// One piece of a replace tag's HTML, which its definition gives as a string or as a function of the tag's attributes
function tagHtml(tag: OpenTag, html: ReplaceTag['close'] | undefined): string | null | undefined {
	if (typeof(html) !== 'function') {
		return html;
	}
	// Parsing fills in tag.attr, so it has to happen before the call reads it
	const attrs = attributesOf(tag);
	return html(tag.attr, attrs);
}

// Runs before a tag's children: the opening tag is replaced first so parents always resolve before what they contain
function enter(doc: Doc, tag: OpenTag): void {
	const definition = tag.kind.definition;
	if (!definition) {
		// ignore invalid BBCode
		resolve(doc, tag.slot, tagText(doc, tag.slot));
		return;
	}

	const type: string = definition.type;
	if (type === 'replace') {
		const open = tagHtml(tag, (definition as ReplaceTag).open);
		if (open) {
			resolve(doc, tag.slot, open);
		}
	} else if (type === 'ignore') {
		// Both ends go together, so a content tag that dropped one of them leaves the other as an unmatched tag
		if (doc.dead?.has(tag.slot) || doc.dead?.has(tag.closeSlot)) {
			return;
		}
		doc.parts[(tag.slot * 2) + 1] = '';
		if (tag.closeSlot !== -1) {
			doc.parts[(tag.closeSlot * 2) + 1] = '';
		}
	} else if (type !== 'content') {
		throw new Error('Cannot parse content block. Invalid block type [' + type + '] provided for tag [' + tag.kind.name + ']');
	}
}

// Closes a tag that has no closing tag of its own, e.g. a [*] list item
function autoClose(doc: Doc, tag: OpenTag, definition: ReplaceTag): void {
	const html = tagHtml(tag, definition.autoClose);

	// Close before the next sibling of the same tag (e.g. the next [*]), not before inline tags like [b] inside this item
	let before: number | undefined;
	for (let sibling = tag.nextSibling; sibling !== undefined; sibling = sibling.nextSibling) {
		if (sibling.kind === tag.kind) {
			before = sibling.slot;
			break;
		}
	}
	if (before === undefined && tag.parent !== undefined && tag.parent.closeSlot !== -1) {
		before = tag.parent.closeSlot;
	}

	// A content tag that dropped the insertion point left nothing to insert before
	if (before === undefined || !html || doc.dead?.has(before)) {
		return;
	}
	doc.parts[before * 2] += html;
}

/**
 * Writes a content tag's output back when it was given placeholders for slots that were still unresolved.
 * Each placeholder it kept goes back to its own slot with the output before it as that slot's text, so the
 * slot can still be resolved later exactly as if the content tag had never wrapped it.
 */
function reseat(doc: Doc, tag: OpenTag, html: string, pending: number[], skips: Map<number, number>): void {
	const { parts } = doc;
	doc.dead ??= new Set();
	const positions = new Map<number, number>();
	for (const [index, slot] of pending.entries()) {
		positions.set(slot, index);
	}
	// The last slot kept so far: everything between it and the next kept slot is no longer part of the output
	let anchor = tag.slot;
	// Index in `pending` of the first slot not yet found in the output
	let next = 0;
	let written = 0;
	for (const match of html.matchAll(placeholders)) {
		const slot = Number(match[1]);
		const found = positions.get(slot);
		if (found === undefined || found < next) {
			// Duplicated, reordered or never handed out: it stays in the text, where parse() cleans it up at the end
			continue;
		}
		for (; next < found; next++) {
			doc.dead.add(pending[next] as number);
		}
		next = found + 1;
		parts[slot * 2] = html.slice(written, match.index);
		parts[(slot * 2) + 1] = undefined;
		skips.set(anchor, slot - 1);
		anchor = slot;
		written = match.index + match[0].length;
	}
	for (; next < pending.length; next++) {
		doc.dead.add(pending[next] as number);
	}
	parts[(tag.slot * 2) + 1] = '';
	parts[(tag.closeSlot * 2) + 1] = html.slice(written);
	skips.set(anchor, tag.closeSlot - 1);
}

// Replaces everything from a content tag's opening tag to its closing tag with what its definition returns
function replaceContent(doc: Doc, tag: OpenTag, definition: ContentTag): void {
	const { parts } = doc;
	const { slot: openSlot, closeSlot } = tag;
	// A mis-nested content tag that dropped either end leaves this tag unmatched
	if (doc.dead?.has(openSlot) || doc.dead?.has(closeSlot)) {
		return;
	}

	let inner = '';
	// Slots still unresolved (e.g. an unmatched closing tag), which the definition sees as placeholders it may keep or drop
	let pending: number[] | undefined;
	// The closing slot always ends the walk; the bound only stops a broken skip from running past it forever
	for (let slot = (doc.skips?.get(openSlot) ?? openSlot) + 1; slot <= closeSlot; slot++) {
		inner += parts[slot * 2];
		parts[slot * 2] = '';
		if (slot === closeSlot) {
			break;
		}
		const value = parts[(slot * 2) + 1];
		if (value === undefined) {
			inner += placeholder(slot);
			pending ??= [];
			pending.push(slot);
		} else {
			inner += value;
		}
		parts[(slot * 2) + 1] = '';
		slot = doc.skips?.get(slot) ?? slot;
	}

	let replace = definition.replace;
	if (typeof(replace) === 'function') {
		const attrs = attributesOf(tag);
		replace = replace(tag.attr, inner, attrs);
	}
	doc.skips ??= new Map();
	if (pending !== undefined) {
		reseat(doc, tag, String(replace), pending, doc.skips);
		return;
	}
	parts[(openSlot * 2) + 1] = String(replace);
	parts[(closeSlot * 2) + 1] = '';
	doc.skips.set(openSlot, doc.skips.get(closeSlot) ?? closeSlot);
}

// Runs after a tag's children, so content tags receive final HTML and a parent's closing slot is still free for autoClose
function leave(doc: Doc, tag: OpenTag): void {
	const definition = tag.kind.definition;
	if (!definition) {
		if (tag.closeSlot !== -1) {
			resolve(doc, tag.closeSlot, tagText(doc, tag.closeSlot));
		}
		return;
	}

	if (definition.type === 'replace') {
		if (definition.autoClose && tag.closeSlot === -1) {
			autoClose(doc, tag, definition);
		}
		const close = tagHtml(tag, definition.close);
		if (close && tag.closeSlot !== -1) {
			resolve(doc, tag.closeSlot, close);
		}
	} else if (definition.type === 'content' && tag.closeSlot !== -1) {
		replaceContent(doc, tag, definition);
	}
}

// Walks the tree without recursion, so deeply nested input cannot overflow the stack
function renderTree(doc: Doc, root: OpenTag | undefined): void {
	let tag = root;
	while (tag !== undefined) {
		enter(doc, tag);
		if (tag.firstChild !== undefined) {
			tag = tag.firstChild;
			continue;
		}
		for (;;) {
			leave(doc, tag);
			if (tag.nextSibling !== undefined) {
				tag = tag.nextSibling;
				break;
			}
			tag = tag.parent;
			if (tag === undefined) {
				return;
			}
		}
	}
}

class yabbcode {
	tags: TagsMap = {
		'url': {
			type: 'replace',
			open: attr => `<a href="${escapeHtml(sanitizeUrl(this.#unsanitize(attr), this.config.allowedSchemes ?? defaultAllowedSchemes) ?? '#')}">`,
			close: '</a>',
		},
		'quote': {
			type: 'replace',
			open: attr => `<blockquote author="${escapeHtml(this.#unsanitize(attr))}">`,
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
		'hr': {
			type: 'replace',
			open: '<hr/>',
			close: null,
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
			close: '</li>',
			autoClose: '</li>',
		},
		'img': {
			type: 'content',
			replace: (attr, content) => {
				// Leftover placeholders are resolved after this check, so a removed one could hide a scheme like `[/b]javascript:`
				let url = content;
				if (url.includes(PLACEHOLDER_START)) {
					url = url.replaceAll(this.regex.placeholders, '');
				}
				url = this.#unsanitize(url);
				const src = sanitizeUrl(url, this.config.allowedSchemes ?? defaultAllowedSchemes);
				if (src === undefined) {
					return '';
				}
				return `<img src="${escapeHtml(src)}" alt="${escapeHtml(this.#unsanitize(attr))}"/>`;
			},
		},
		'noparse': {
			type: 'ignore',
		},
	};

	regex = {
		placeholders: /\0(\d+);/g,
	};

	config: Config;

	constructor(config: Config = {}) {
		this.config = {
			newline: true,
			paragraph: false,
			cleanUnmatchable: true,
			sanitizeHtml: true,
			allowedSchemes: [...defaultAllowedSchemes],
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

	// Built-in attribute tags escape for themselves, so undo parse()'s sanitizing first to avoid double-escaping `&`.
	#unsanitize(value: string): string {
		if (!this.config.sanitizeHtml) {
			return value;
		}
		return unescapeSanitized(value);
	}

	// What an unresolved slot becomes: nothing, or the original tag, escaped because it can land inside an attribute
	#leftover(doc: Doc, slot: number): string {
		if (this.config.cleanUnmatchable || slot * 2 >= doc.bounds.length) {
			return '';
		}
		// With sanitizeHtml off the input was never escaped, so the tag is escaped here instead
		return tagText(doc, slot, !this.config.sanitizeHtml);
	}

	clearTags(): this {
		this.tags = {};
		return this;
	}

	registerTag(tag: string, options: TagDefinition): this {
		const tagName = String(tag).toLowerCase();

		// Prevent prototype pollution
		if (dangerousKeys.has(tagName)) {
			throw new Error(`Cannot register tag with dangerous name: ${tagName}`);
		}

		this.tags[tagName] = options;
		return this;
	}

	parse(bbcInput: string | number | boolean): string {
		if (
			typeof(bbcInput) === 'boolean'
			|| (typeof(bbcInput) !== 'string' && Number.isNaN(Number(bbcInput)))
		) {
			return '';
		}
		let input = String(bbcInput);
		if (input.includes(PLACEHOLDER_START)) {
			input = input.replaceAll(PLACEHOLDER_START, '');
		}
		if (this.config.sanitizeHtml) {
			input = escapeHtml(input);
		}

		let lineBreak: string | undefined;
		if (this.config.newline) {
			lineBreak = '<br/>';
			if (this.config.paragraph) {
				lineBreak = PARAGRAPH_BREAK;
			}
		}
		const doc: Doc = {
			input,
			lineBreak,
			parts: [],
			bounds: [],
			nextLf: -1,
			nextCr: -1,
			skips: undefined,
			dead: undefined,
		};
		const { parts } = doc;

		const root = buildTree(doc, this.tags);
		if (this.config.paragraph) {
			parts[0] = '<p>' + parts[0];
			parts[parts.length - 1] += '</p>';
		}
		renderTree(doc, root);

		// Slots are internal markers, so unresolved ones become nothing or the original BBCode, never leak
		if (!this.config.cleanUnmatchable) {
			for (let index = 1; index < parts.length; index += 2) {
				if (parts[index] === undefined) {
					parts[index] = this.#leftover(doc, (index - 1) / 2);
				}
			}
		}
		// join() writes unresolved slots as empty strings, and returns one flat string rather than a chain of pieces
		const output = parts.join('');
		// Only a tag function can put a placeholder into the output, by repeating one it was given or by producing a NUL itself
		if (!output.includes(PLACEHOLDER_START)) {
			return output;
		}
		return output.replaceAll(placeholders, (_match: string, index: string) => this.#leftover(doc, Number(index)));
	}
}

// Export types for users
export type { Config, TagAttributes, ReplaceTag, ContentTag, IgnoreTag, TagDefinition };

// Default export for both CJS and ESM
export default yabbcode;
