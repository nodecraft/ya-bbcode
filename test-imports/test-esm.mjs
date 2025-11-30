// Test ESM import
import yabbcode from '../dist/ya-bbcode.mjs';

console.log('Testing ESM import...');

const parser = new yabbcode();
const result = parser.parse('[b]Hello World[/b]');

if (result === '<strong>Hello World</strong>') {
	console.log('✅ ESM import works correctly');
	// eslint-disable-next-line n/no-process-exit
	process.exit(0);
} else {
	console.error('❌ ESM import failed. Got:', result);
	// eslint-disable-next-line n/no-process-exit
	process.exit(1);
}
