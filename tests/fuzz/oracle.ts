import { parseFragment } from 'parse5';

import type { DefaultTreeAdapterTypes } from 'parse5';

// Every element and attribute the default tags (plus newline/paragraph handling) can emit.
const allowedAttributes: Record<string, string[]> = {
	a: ['href'],
	blockquote: ['author'],
	strong: [],
	u: [],
	i: [],
	h1: [],
	h2: [],
	h3: [],
	h4: [],
	h5: [],
	h6: [],
	code: [],
	hr: [],
	span: ['class'],
	ul: [],
	ol: [],
	li: [],
	img: ['src', 'alt'],
	br: [],
	p: [],
};

const allowedClasses = new Set(['yabbcode-strike', 'yabbcode-spoiler']);
const allowedProtocols = new Set(['http:', 'https:', 'mailto:', 'ftp:', 'ftps:']);

const urlAttributes = new Set(['a.href', 'img.src']);

function checkUrl(name: string, url: string): string | undefined {
	let protocol: string;
	try {
		// Resolve the way a browser would, so entity, whitespace and control-character tricks are judged by their real effect.
		protocol = new URL(url, 'https://base.invalid/').protocol;
	} catch {
		return undefined;
	}
	if (allowedProtocols.has(protocol)) {
		return undefined;
	}
	return `${name} resolves to disallowed protocol ${protocol}: ${JSON.stringify(url)}`;
}

function walk(node: DefaultTreeAdapterTypes.ChildNode, problems: string[]): void {
	if (node.nodeName === '#text') {
		return;
	}
	if (node.nodeName === '#comment' || node.nodeName === '#documentType' || !('tagName' in node)) {
		problems.push(`unexpected node ${node.nodeName}`);
		return;
	}

	const allowed = allowedAttributes[node.tagName];
	if (!allowed) {
		problems.push(`unexpected element <${node.tagName}>`);
	}
	for (const attr of node.attrs) {
		if (!allowed?.includes(attr.name)) {
			problems.push(`unexpected attribute ${attr.name} on <${node.tagName}>`);
			continue;
		}
		if (urlAttributes.has(`${node.tagName}.${attr.name}`)) {
			const problem = checkUrl(attr.name, attr.value);
			if (problem) {
				problems.push(problem);
			}
		}
		if (node.tagName === 'span' && attr.name === 'class' && !allowedClasses.has(attr.value)) {
			problems.push(`unexpected class ${JSON.stringify(attr.value)}`);
		}
	}

	for (const child of node.childNodes) {
		walk(child, problems);
	}
}

/**
 * Parses output as a browser would and lists anything the default tags could never legitimately produce:
 * unknown elements or attributes (e.g. injected event handlers), unsafe link protocols, or leaked placeholders.
 */
export function findUnsafeOutput(html: string): string[] {
	const problems: string[] = [];
	if (html.includes('\0')) {
		problems.push('output contains a NUL placeholder marker');
	}
	for (const node of parseFragment(html).childNodes) {
		walk(node, problems);
	}
	return problems;
}
