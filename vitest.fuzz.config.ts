import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/fuzz/**/*.fuzz.test.ts'],
		// A synchronous infinite loop can only be stopped by killing the worker, which needs the forks pool
		pool: 'forks',
		testTimeout: 120000,
	},
});
