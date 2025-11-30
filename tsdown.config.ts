import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/ya-bbcode.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	clean: true,
	minify: false,
	sourcemap: true,
	outDir: 'dist',
	platform: 'node',
	target: 'es2024',
});
