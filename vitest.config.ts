import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		testTimeout: 10000,
		hookTimeout: 10000,
		teardownTimeout: 10000,
		coverage: {
			reporter: 'lcov',
			provider: 'v8',
		},
	},
});
