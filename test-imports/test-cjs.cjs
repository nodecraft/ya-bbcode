// Test CJS require
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yabbcode = require('../dist/ya-bbcode.cjs');

console.log('Testing CJS require...');

const parser = new yabbcode();
const result = parser.parse('[b]Hello World[/b]');

if (result === '<strong>Hello World</strong>') {
	console.log('✅ CJS require works correctly');
	// eslint-disable-next-line n/no-process-exit
	process.exit(0);
} else {
	console.error('❌ CJS require failed. Got:', result);
	// eslint-disable-next-line n/no-process-exit
	process.exit(1);
}
