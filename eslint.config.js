import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.ts',
      '*.config.js',
      'packages/**/dist/**',
      'packages/**/node_modules/**',
      'docs-site/.vitepress/cache/**',
      'docs-site/.vitepress/dist/**',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: [
      '**/tests/**/*.{ts,tsx,js,mjs,cjs}',
      '**/__tests__/**/*.{ts,tsx,js,mjs,cjs}',
      '**/examples/**/*.{ts,tsx,js,mjs,cjs}',
      '**/templates/**/*.{ts,tsx,js,mjs,cjs}',
    ],
    rules: {
      // Tests/examples frequently use variadic mock signatures; keep visibility while reducing noise.
      '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
    },
  }
);
