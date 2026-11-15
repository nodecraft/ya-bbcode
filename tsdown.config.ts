import { defineConfig } from 'tsdown';

import type { UserConfig } from 'tsdown';

const shared: UserConfig = {
	dts: true,
	clean: true,
	minify: false,
	sourcemap: true,
	outDir: 'dist',
	platform: 'node',
	target: 'es2024',
};

// CommonJS has its own entry because its types can only be `export =` when the entry exports nothing but the class
export default defineConfig([
	{ ...shared, entry: { 'ya-bbcode': 'src/ya-bbcode.ts' }, format: 'esm' },
	{ ...shared, entry: { 'ya-bbcode': 'src/cjs.ts' }, format: 'cjs' },
]);
