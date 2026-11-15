// Type definitions
interface Config {
	newline?: boolean;
	paragraph?: boolean;
	cleanUnmatchable?: boolean;
	sanitizeHtml?: boolean;
	allowedSchemes?: string[];
	/**
	 * Match tag names exactly instead of ignoring case, for dialects like Godot's where [signal x] is a tag but
	 * [Signal] names a class. Tags are then registered and matched as written, and the built-in tags are lowercase.
	 */
	caseSensitive?: boolean;
}

// Parsed attributes from tags like [code lang=javascript skip-lint]
interface TagAttributes {
	[key: string]: string | boolean;
}

/**
 * Builds a replace tag's HTML. `content` is the text between the opening and closing tag exactly as written
 * (HTML-escaped when sanitizeHtml is on, inner BBCode left as is), or empty when the tag never closes.
 */
type ReplaceHtml = (attr: string, attrs: TagAttributes, content: string) => string;

interface ReplaceTag {
	type: 'replace';
	open: ReplaceHtml | string;
	close: ReplaceHtml | string | null;
	/**
	 * HTML to insert when the tag implicitly closes (e.g., before next sibling or parent close).
	 * Useful for tags like [*] that don't have explicit closing tags in BBCode.
	 */
	autoClose?: ReplaceHtml | string;
	/**
	 * Renders as a block element, so one newline on each side of its opening and closing tags is dropped
	 * instead of becoming a stray `<br/>`. Has no effect when `newline` is off or `paragraph` is on.
	 */
	block?: boolean;
}

interface ContentTag {
	type: 'content';
	replace: ((attr: string, content: string, attrs: TagAttributes) => string) | string;
	/** See {@link ReplaceTag.block} */
	block?: boolean;
	/**
	 * Hands `replace` the content as written: BBCode inside is not parsed and newlines are not converted.
	 * It is still HTML-escaped when sanitizeHtml is on; `parser.unescapeHtml()` gives back the original text.
	 */
	raw?: boolean;
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
	block: boolean;
	// BBCode inside is plain text, as for noparse and raw content tags
	literal: boolean;
	// Newlines inside are kept as written too
	raw: boolean;
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

// How quote marks around attribute values appear in the input, which parse() may already have HTML-escaped
interface Quotes {
	double: string;
	single: string;
	// `=` then the mark, which is how a quoted value starts
	doubleOpener: string;
	singleOpener: string;
}

const rawQuotes: Quotes = { double: '"', single: '\'', doubleOpener: '="', singleOpener: '=\'' };
const escapedQuotes: Quotes = { double: '&quot;', single: '&#39;', doubleOpener: '=&quot;', singleOpener: '=&#39;' };

// One kind of quote mark, remembering where the next ones are so the input is only searched once
interface QuoteMark {
	text: string;
	opener: string;
	// The next opener at or after the last position searched from
	next: number;
	// The last search for a closing mark: from where, what it found (Infinity for none), and up to where that answer holds
	closeFrom: number;
	close: number;
	closeLimit: number;
}

interface QuoteScan {
	double: QuoteMark;
	single: QuoteMark;
	// The next newline at or after the last position searched from, since a quoted value never spans lines
	lineEnd: number;
}

// One parse() call's working state, kept off the instance so a tag function can safely call parse() again
interface Doc {
	input: string;
	quotes: Quotes;
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
const LINE_BREAK = '<br/>';

const newlines = /\r\n|\r|\n/g;
const placeholders = /\0(\d+);/g;
const whitespace = /\s/;
const escapable = /["&'<>]/g;
const tabOrNewline = /[\t\n\r]/;
const relativeUrl = /^\.{0,2}\//;
const schemeName = /^[a-z][\d+.a-z-]*$/;
const absoluteUrl = /^[a-z][\d+.a-z-]*:/i;
const whitespaceFrom = /\s/g;
const orderedListTypes = new Set(['1', 'a', 'A', 'i', 'I']);
// The post details quote buttons add after the name: vBulletin `Name;123`, XenForo and Discourse `Name, post: 1, member: 2`
const quoteDetails = /;n?\d+$|,\s*\w+:/;
const wrappedInQuotes = /^(["'])(.*)\1$/s;

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

// Where the tag name ends: at the first `=` in [tag=value], or at the first whitespace in [tag key=value flag]
function nameEnd(content: string): number {
	const firstEquals = content.indexOf('=');
	const firstSpace = content.indexOf(' ');
	if (firstSpace === -1 || (firstEquals !== -1 && firstEquals < firstSpace)) {
		if (firstEquals === -1) {
			return content.length;
		}
		return firstEquals;
	}
	return content.search(whitespace);
}

function tagName(content: string, caseSensitive: boolean): string {
	const name = content.slice(0, nameEnd(content));
	if (caseSensitive) {
		return name;
	}
	return name.toLowerCase();
}

function whitespaceAt(content: string, from: number): number {
	whitespaceFrom.lastIndex = from;
	const match = whitespaceFrom.exec(content);
	if (match === null) {
		return content.length;
	}
	return match.index;
}

// Whether whitespace at `index` is followed by a `key=` word, read in one pass since a regex here backtracks on long runs of spaces
function keyedWordFollows(text: string, index: number): boolean {
	let at = index;
	while (at < text.length && whitespace.test(text.charAt(at))) {
		at++;
	}
	if (at === index) {
		return false;
	}
	const keyStart = at;
	while (at < text.length) {
		const character = text.charAt(at);
		if (character === '=') {
			return at > keyStart;
		}
		if (character === ']' || whitespace.test(character)) {
			return false;
		}
		at++;
	}
	return false;
}

// Where the whitespace before the next space-separated `key=value` word starts, or -1
function keyedWordAt(content: string, from: number): number {
	// Most values have no other `=`, which settles it without looking at each word
	if (!content.includes('=', from)) {
		return -1;
	}
	let index = whitespaceAt(content, from);
	while (index < content.length) {
		if (keyedWordFollows(content, index)) {
			return index;
		}
		// Moving past this whitespace and the word after it means each character is looked at a bounded number of times
		let wordStart = index;
		while (wordStart < content.length && whitespace.test(content.charAt(wordStart))) {
			wordStart++;
		}
		index = whitespaceAt(content, wordStart);
	}
	return -1;
}

/**
 * Reads a value wrapped in matching quotes at `start`, returning its text and where it ends. Undefined when the
 * value is not quoted, or its quote never closes, so it is read as unquoted text instead.
 */
function quotedValue(content: string, start: number, quotes: Quotes): [string, number] | undefined {
	let mark = quotes.double;
	if (!content.startsWith(mark, start)) {
		mark = quotes.single;
		if (!content.startsWith(mark, start)) {
			return undefined;
		}
	}
	const from = start + mark.length;
	// A quote inside the value, as in "Bob "the Builder"", only closes it when whitespace or the end follows
	let index = content.indexOf(mark, from);
	while (index !== -1) {
		const end = index + mark.length;
		if (end === content.length || whitespace.test(content.charAt(end))) {
			return [content.slice(from, index), end];
		}
		index = content.indexOf(mark, end);
	}
	return undefined;
}

// Adds each `key=value` and bare `flag` from `start` on to attrs, returning the first non-empty value
function addAttributes(content: string, start: number, attrs: TagAttributes, quotes: Quotes): string {
	let firstValue = '';
	let index = start;
	while (index < content.length) {
		if (whitespace.test(content.charAt(index))) {
			index++;
			continue;
		}
		const wordEnd = whitespaceAt(content, index);
		const equals = content.indexOf('=', index);
		if (equals === -1 || equals > wordEnd) {
			const flag = content.slice(index, wordEnd);
			if (!dangerousKeys.has(flag.toLowerCase())) {
				attrs[flag] = true;
			}
			index = wordEnd;
			continue;
		}
		const key = content.slice(index, equals);
		let value: string;
		const quoted = quotedValue(content, equals + 1, quotes);
		if (quoted === undefined) {
			// SMF writes names unquoted, as in author=John Smith link=…, so bare words before another key=value join the value
			let end = whitespaceAt(content, equals + 1);
			const keyed = keyedWordAt(content, end);
			if (keyed !== -1) {
				end = keyed;
			}
			value = content.slice(equals + 1, end);
			index = end;
		} else {
			[value, index] = quoted;
		}
		if (!dangerousKeys.has(key.toLowerCase())) {
			attrs[key] = value;
		}
		if (!firstValue && value) {
			firstValue = value;
		}
	}
	return firstValue;
}

/**
 * Parse a tag's attributes from the text between its brackets
 * Supports these formats, with any value optionally wrapped in "double" or 'single' quotes:
 * - [tag=value] → attr: 'value', attrs: {}
 * - [tag key=value flag] → attr: 'value', attrs: { key: 'value', flag: true }
 * - [tag=value key=other flag] → attr: 'value', attrs: { key: 'other', flag: true }
 */
function attributesOf(tag: OpenTag, quotes: Quotes): TagAttributes {
	if (tag.attrs !== undefined) {
		return tag.attrs;
	}
	const content = tag.content;
	const index = nameEnd(content);
	// Where the named attributes start, after the name or the [tag=value] value
	let rest = index;
	let hasValue = false;
	if (content.charAt(index) === '=') {
		hasValue = true;
		const quoted = quotedValue(content, index + 1, quotes);
		if (quoted === undefined) {
			// Unquoted, it may hold spaces as in [quote=Some user], so it only ends at a word that is itself key=value
			rest = keyedWordAt(content, index + 1);
			if (rest === -1) {
				rest = content.length;
			}
			tag.attr = content.slice(index + 1, rest);
		} else {
			tag.attr = quoted[0];
			rest = quoted[1];
		}
	}
	// A plain object is much cheaper to create, and is safe here because no key from the input is ever written to it
	if (rest === content.length) {
		tag.attrs = {};
		return tag.attrs;
	}
	// Use Object.create(null) to prevent prototype pollution
	const attrs = Object.create(null) as TagAttributes;
	tag.attrs = attrs;
	const firstValue = addAttributes(content, rest, attrs, quotes);
	if (!hasValue) {
		tag.attr = firstValue;
	}
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

// Where text ending at `end` stops once the newline that only put a block tag on its own line is dropped
function endBeforeNewline(input: string, start: number, end: number): number {
	if (end === start) {
		return end;
	}
	const last = input.charAt(end - 1);
	if (last === '\n' && end - 1 > start && input.charAt(end - 2) === '\r') {
		return end - 2;
	}
	if (last === '\n' || last === '\r') {
		return end - 1;
	}
	return end;
}

// Where text starting at `start` begins once the newline that follows a block tag is dropped
function startAfterNewline(input: string, start: number): number {
	const first = input.charAt(start);
	if (first === '\r' && input.charAt(start + 1) === '\n') {
		return start + 2;
	}
	if (first === '\n' || first === '\r') {
		return start + 1;
	}
	return start;
}

function onlyNewlines(input: string, start: number, end: number): boolean {
	for (let index = start; index < end; index++) {
		const character = input.charAt(index);
		if (character !== '\n' && character !== '\r') {
			return false;
		}
	}
	return true;
}

function quoteMark(text: string, opener: string): QuoteMark {
	return { text, opener, next: -1, closeFrom: -1, close: -1, closeLimit: -1 };
}

// Most documents have no quoted values at all, so they skip looking for them in every tag
function quoteScan(input: string, quotes: Quotes, from: number): QuoteScan | undefined {
	if (!input.includes(quotes.doubleOpener, from) && !input.includes(quotes.singleOpener, from)) {
		return undefined;
	}
	return {
		double: quoteMark(quotes.double, quotes.doubleOpener),
		single: quoteMark(quotes.single, quotes.singleOpener),
		lineEnd: -1,
	};
}

function nextOpener(input: string, mark: QuoteMark, from: number): number {
	if (mark.next < from) {
		mark.next = indexOrEnd(input, mark.opener, from);
	}
	return mark.next;
}

function lineEndFrom(input: string, scan: QuoteScan, from: number): number {
	if (scan.lineEnd < from) {
		scan.lineEnd = Math.min(indexOrEnd(input, '\n', from), indexOrEnd(input, '\r', from));
	}
	return scan.lineEnd;
}

/**
 * The mark closing a value that opens just before `from`: the next one on its line that ends the tag or starts
 * another key=value, which a stray quote in a typo like [quote="Bob]hi "there" rarely does.
 */
function closingMark(input: string, scan: QuoteScan, mark: QuoteMark, from: number): number {
	// No valid closing mark lies between the last search's start and its answer, so the answer still holds from anywhere in between
	if (mark.closeFrom <= from && from <= mark.closeLimit) {
		return mark.close;
	}
	const limit = lineEndFrom(input, scan, from);
	mark.closeFrom = from;
	let index = input.indexOf(mark.text, from);
	while (index !== -1 && index < limit) {
		const after = index + mark.text.length;
		if (input.charAt(after) === ']' || keyedWordFollows(input, after)) {
			mark.close = index;
			mark.closeLimit = index;
			return index;
		}
		index = input.indexOf(mark.text, index + 1);
	}
	mark.close = Infinity;
	mark.closeLimit = limit;
	return Infinity;
}

// The `]` that ends a tag opened at `open`, which is past `close` when that one sits inside a quoted value like [quote="a]b"]
function tagEnd(input: string, scan: QuoteScan, open: number, close: number): number {
	let end = close;
	let from = open + 1;
	for (;;) {
		let mark = scan.double;
		let index = nextOpener(input, scan.double, from);
		const single = nextOpener(input, scan.single, from);
		if (single < index) {
			mark = scan.single;
			index = single;
		}
		if (index > end) {
			return end;
		}
		const valueStart = index + mark.opener.length;
		from = valueStart;
		const closing = closingMark(input, scan, mark, from);
		if (closing === Infinity) {
			continue;
		}
		from = closing + mark.text.length;
		if (closing < end) {
			continue;
		}
		// A quote before this `]` already ended the value, if untidily as in [quote="Bob" ] or [quote="Bob";12], so the `]` ends the tag
		if (input.lastIndexOf(mark.text, end - 1) >= valueStart) {
			return end;
		}
		const next = input.indexOf(']', from);
		if (next === -1) {
			return close;
		}
		end = next;
	}
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
function kindOf(kinds: Map<string, TagKind>, tags: TagsMap, content: string, caseSensitive: boolean): TagKind {
	const name = tagName(content, caseSensitive);
	let kind = kinds.get(name);
	if (kind === undefined) {
		// Tag names come from user input, so inherited keys like `constructor` must not resolve to Object.prototype members.
		let definition: TagDefinition | undefined;
		if (Object.hasOwn(tags, name)) {
			definition = tags[name];
		}
		kind = { name, definition, lastOpen: undefined, block: false, literal: false, raw: false };
		if (definition?.type === 'ignore') {
			kind.literal = true;
		} else if (definition !== undefined) {
			kind.block = definition.block === true;
			if (definition.type === 'content' && definition.raw === true) {
				kind.literal = true;
				kind.raw = true;
			}
		}
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
function buildTree(doc: Doc, tags: TagsMap, caseSensitive: boolean): OpenTag | undefined {
	const { input, parts, bounds } = doc;
	const kinds = new Map<string, TagKind>();
	// Documents repeat a few short tags, so the last spelling seen per hash is checked before allocating and hashing a new string
	const recent: (Spelling | undefined)[] = [];
	// Opening tags no parent has claimed yet, in document order
	const orphans: OpenTag[] = [];
	let unclosed = 0;
	// The ignore tag (e.g. noparse) or raw content tag whose contents are currently being skipped as plain text
	let ignoring: TagKind | undefined;
	// Only <br/> needs it: retained newlines are harmless and paragraph breaks still separate the text around a block
	const trimBlocks = doc.lineBreak === LINE_BREAK;
	// Whether the last tag was a block tag that dropped the newline after it
	let afterBlock = false;
	let textStart = 0;
	let from = input.indexOf('[');
	// Searched from the first bracket on, so text without any never looks for quoted values
	let scan: QuoteScan | undefined;
	if (from === -1) {
		from = input.length;
	} else {
		scan = quoteScan(input, doc.quotes, from);
	}
	// Cached positions of the next `]` and `^`, so input like `[[[[` is scanned once rather than once per bracket
	let close = -1;
	let caret = -1;

	// A tag is `[`, one or more characters other than `]` and `^`, then `]`, though a `]` inside a quoted value doesn't end it
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
		// Inside an ignore or raw tag a quote is plain text, so it must not stretch a tag over the closing one
		if (scan !== undefined && ignoring === undefined) {
			const end = tagEnd(input, scan, open, close);
			// A caret inside the quoted value still rules the longer tag out, so the tag ends at its first `]` as before
			if (end < caret) {
				close = end;
			}
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
			spelling = { content, kind: kindOf(kinds, tags, content, caseSensitive) };
			if (length <= recentMaxLength) {
				recent[hash] = spelling;
			}
		}
		const { content, kind } = spelling;
		let raw = false;
		if (ignoring !== undefined) {
			if (kind !== ignoring) {
				continue;
			}
			ignoring = undefined;
			raw = kind.raw;
		}

		const slot = bounds.length / 2;
		bounds.push(open, close + 1);
		// Most tags leave the text around them alone, so they take the short way here
		if (!raw && !(trimBlocks && kind.block)) {
			parts.push(textBetween(doc, textStart, open), undefined);
			textStart = close + 1;
			afterBlock = false;
		} else {
			// A stray closing tag renders as nothing or as itself, so it keeps the newlines around it
			const block = trimBlocks && kind.block && (!isClosing || kind.lastOpen !== undefined);
			let textEnd = open;
			// Between two block tags a run of newlines loses one, not two, so a blank line between them survives
			if (block && !(afterBlock && onlyNewlines(input, textStart, open))) {
				textEnd = endBeforeNewline(input, textStart, open);
			}
			if (raw) {
				parts.push(input.slice(textStart, textEnd), undefined);
			} else {
				parts.push(textBetween(doc, textStart, textEnd), undefined);
			}
			textStart = close + 1;
			afterBlock = false;
			if (block) {
				const next = startAfterNewline(input, textStart);
				afterBlock = next !== textStart;
				textStart = next;
			}
		}

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
		if (kind.literal) {
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
function tagHtml(doc: Doc, tag: OpenTag, html: ReplaceTag['close'] | undefined): string | null | undefined {
	if (typeof(html) !== 'function') {
		return html;
	}
	// Parsing fills in tag.attr, so it has to happen before the call reads it
	const attrs = attributesOf(tag, doc.quotes);
	let content = '';
	if (tag.closeSlot !== -1) {
		content = doc.input.slice(doc.bounds[(tag.slot * 2) + 1], doc.bounds[tag.closeSlot * 2]);
	}
	return html(tag.attr, attrs, content);
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
		const open = tagHtml(doc, tag, (definition as ReplaceTag).open);
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
	const html = tagHtml(doc, tag, definition.autoClose);

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
		const attrs = attributesOf(tag, doc.quotes);
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
		const close = tagHtml(doc, tag, definition.close);
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
			open: (attr, _attrs, content) => {
				let href: string | undefined;
				if (attr) {
					href = this.sanitizeUrl(attr);
				} else {
					href = this.#urlFromText(content);
				}
				return `<a href="${href ?? '#'}">`;
			},
			close: '</a>',
		},
		'quote': {
			type: 'replace',
			open: (attr, attrs) => `<blockquote author="${this.#quoteAuthor(attr, attrs)}">`,
			close: '</blockquote>',
			block: true,
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
			block: true,
		},
		'h2': {
			type: 'replace',
			open: '<h2>',
			close: '</h2>',
			block: true,
		},
		'h3': {
			type: 'replace',
			open: '<h3>',
			close: '</h3>',
			block: true,
		},
		'h4': {
			type: 'replace',
			open: '<h4>',
			close: '</h4>',
			block: true,
		},
		'h5': {
			type: 'replace',
			open: '<h5>',
			close: '</h5>',
			block: true,
		},
		'h6': {
			type: 'replace',
			open: '<h6>',
			close: '</h6>',
			block: true,
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
			block: true,
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
			// [list=1], [list=a] and the like number their items, as phpBB, MyBB and vBulletin do
			open: (attr) => {
				if (orderedListTypes.has(attr)) {
					return `<ol type="${attr}">`;
				}
				return '<ul>';
			},
			close: (attr) => {
				if (orderedListTypes.has(attr)) {
					return '</ol>';
				}
				return '</ul>';
			},
			block: true,
		},
		'olist': {
			type: 'replace',
			open: '<ol>',
			close: '</ol>',
			block: true,
		},
		'*': {
			type: 'replace',
			open: '<li>',
			close: '</li>',
			autoClose: '</li>',
			block: true,
		},
		'img': {
			type: 'content',
			replace: (attr, content) => {
				// Leftover placeholders are resolved after this check, so a removed one could hide a scheme like `[/b]javascript:`
				let url = content;
				if (url.includes(PLACEHOLDER_START)) {
					url = url.replaceAll(this.regex.placeholders, '');
				}
				const src = this.sanitizeUrl(url);
				if (src === undefined) {
					return '';
				}
				return `<img src="${src}" alt="${this.escapeHtml(attr)}"/>`;
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
		if (config.caseSensitive !== undefined) {
			this.config.caseSensitive = config.caseSensitive;
		}
	}

	// Forum exports put post details beside the name, which readers don't need: SMF also names it as an author= attribute
	#quoteAuthor(attr: string, attrs: TagAttributes): string {
		let author = attr;
		if (typeof(attrs.author) === 'string') {
			author = attrs.author;
		}
		author = this.unescapeHtml(author);
		// Plain names skip the regexes, which every quote would otherwise pay for
		if (author.includes(';') || author.includes(',')) {
			const details = author.search(quoteDetails);
			if (details !== -1) {
				author = author.slice(0, details);
			}
			// vBulletin can quote the name before its post id, as in "King Of Kings";172380, so those quotes survive parsing
			const quoted = wrappedInQuotes.exec(author);
			if (quoted !== null) {
				author = quoted[2] ?? '';
			}
		}
		return escapeHtml(author);
	}

	// [url]https://example.com[/url] links to its own text, but only when that text is an absolute URL rather than a label
	#urlFromText(text: string): string | undefined {
		// Text holding tags is not a URL, and stopping at the first `[` keeps nested [url] tags from each reading all they contain
		if (text.includes('[')) {
			return undefined;
		}
		const url = normalizeUrl(this.unescapeHtml(text));
		if (!absoluteUrl.test(url) || whitespace.test(url)) {
			return undefined;
		}
		return this.sanitizeUrl(text);
	}

	// What an unresolved slot becomes: nothing, or the original tag, escaped because it can land inside an attribute
	#leftover(doc: Doc, slot: number): string {
		if (this.config.cleanUnmatchable || slot * 2 >= doc.bounds.length) {
			return '';
		}
		// With sanitizeHtml off the input was never escaped, so the tag is escaped here instead
		return tagText(doc, slot, !this.config.sanitizeHtml);
	}

	/**
	 * Gives back the original text of an attribute or content that parse() HTML-escaped before handing it to a tag
	 * function. Returns the value unchanged when sanitizeHtml is off, since nothing was escaped.
	 */
	unescapeHtml(value: string): string {
		if (!this.config.sanitizeHtml) {
			return value;
		}
		return unescapeSanitized(value);
	}

	/**
	 * Escapes text for HTML content or a quoted attribute value. Safe to call on values parse() hands to tag
	 * functions, which are already escaped when sanitizeHtml is on: they are not escaped twice. That means with
	 * sanitizeHtml on, entities in any value are decoded first, so `&amp;` renders as `&` rather than as written.
	 */
	escapeHtml(value: string): string {
		return escapeHtml(this.unescapeHtml(value));
	}

	/**
	 * Makes a URL safe for an href or src attribute: returns it escaped, or undefined when it is empty or its scheme
	 * is not in allowedSchemes. Like escapeHtml(), it accepts values parse() hands to tag functions as they are.
	 */
	sanitizeUrl(url: string): string | undefined {
		const safe = sanitizeUrl(this.unescapeHtml(url), this.config.allowedSchemes ?? defaultAllowedSchemes);
		if (safe === undefined) {
			return undefined;
		}
		return escapeHtml(safe);
	}

	clearTags(): this {
		this.tags = {};
		return this;
	}

	registerTag(tag: string, options: TagDefinition): this {
		let tagName = String(tag);
		if (!this.config.caseSensitive) {
			tagName = tagName.toLowerCase();
		}

		// Assigning `__proto__` would replace the prototype. `constructor` and `prototype` become own properties, and Godot's docs use [constructor].
		if (tagName === '__proto__') {
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
		let quotes = rawQuotes;
		if (this.config.sanitizeHtml) {
			input = escapeHtml(input);
			quotes = escapedQuotes;
		}

		let lineBreak: string | undefined;
		if (this.config.newline) {
			lineBreak = LINE_BREAK;
			if (this.config.paragraph) {
				lineBreak = PARAGRAPH_BREAK;
			}
		}
		const doc: Doc = {
			input,
			quotes,
			lineBreak,
			parts: [],
			bounds: [],
			nextLf: -1,
			nextCr: -1,
			skips: undefined,
			dead: undefined,
		};
		const { parts } = doc;

		const root = buildTree(doc, this.tags, this.config.caseSensitive === true);
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

// Aliases for the namespace below, which can't refer to the outer types by their own names
type ConfigType = Config;
type TagAttributesType = TagAttributes;
type ReplaceHtmlType = ReplaceHtml;
type ReplaceTagType = ReplaceTag;
type ContentTagType = ContentTag;
type IgnoreTagType = IgnoreTag;
type TagDefinitionType = TagDefinition;

// CommonJS exports only the class, so its types are also reachable through it, as in yabbcode.Config
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace yabbcode {
	export type Config = ConfigType;
	export type TagAttributes = TagAttributesType;
	export type ReplaceHtml = ReplaceHtmlType;
	export type ReplaceTag = ReplaceTagType;
	export type ContentTag = ContentTagType;
	export type IgnoreTag = IgnoreTagType;
	export type TagDefinition = TagDefinitionType;
}

// Export types for users
export type { Config, TagAttributes, ReplaceHtml, ReplaceTag, ContentTag, IgnoreTag, TagDefinition };

// Default export for both CJS and ESM
export default yabbcode;
