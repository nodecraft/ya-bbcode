// CommonJS consumers get the class itself, as in Godot's VS Code extension
// eslint-disable-next-line @typescript-eslint/no-require-imports
import yabbcode = require('ya-bbcode');

const config: yabbcode.Config = { caseSensitive: true };
const tag: yabbcode.TagDefinition = { type: 'replace', open: (attr, _attrs, content) => attr + content, close: null };
const parser: yabbcode = new yabbcode(config).registerTag('x', tag);

export const html: string = parser.parse('[x=a]b[/x]');
