import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Fuzz suites are randomized and run separately via `npm run test:fuzz`
		exclude: [...configDefaults.exclude, '**/*.fuzz.test.ts'],
		testTimeout: 10000,
		hookTimeout: 10000,
		teardownTimeout: 10000,
		coverage: {
			reporter: ['text', 'lcov'],
			provider: 'v8',
			exclude: [
				'**/*.test.{ts,js}',
				'**/*.config.{ts,js}',
				'**/*.d.{ts,js}',
			],
		},
	},
});
