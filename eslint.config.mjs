import nodecraft from '@nodecraft/eslint-config';

export default [
	{
		ignores: [
			'dist/**',
			'coverage/**',
			'node_modules/**',
			'**/*.d.ts',
		],
	},
	...nodecraft.configs.typescript,
	...nodecraft.configs.node,
	{
		rules: {
			// eslint-plugin-n's recommended set re-enables these after the TypeScript config turns them off.
			'n/no-unsupported-features/es-syntax': 'off',
			'n/no-missing-import': 'off',
			// The public API is called from plain JS, so String() coercion of typed params is intentional.
			'unicorn/no-useless-coercion': 'off',
		},
	},
	{
		files: ['tests/**'],
		rules: {
			// Tests deliberately feed http:// URLs to check scheme handling.
			'unicorn/prefer-https': 'off',
		},
	},
];
