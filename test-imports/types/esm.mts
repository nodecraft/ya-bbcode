import yabbcode from 'ya-bbcode';

import type { Config, TagDefinition } from 'ya-bbcode';

const config: Config = { caseSensitive: true };
const tag: TagDefinition = { type: 'content', raw: true, replace: (attr, content) => attr + content };
const parser: yabbcode = new yabbcode(config).registerTag('x', tag);

export const html: string = parser.parse('[x=a]b[/x]');
