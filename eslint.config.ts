import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/', 'node_modules/', 'demo/']),

  // JavaScript base rules for all files
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },

  // TypeScript-specific rules
  {
    files: ['**/*.{ts,mts,cts}'],
    extends: [tseslint.configs.recommended],
    rules: {
      // Align with the strict tsconfig — unused vars are already a tsc error,
      // but having ESLint report them too gives faster feedback in the editor.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Prefer `import type` for type-only imports (pairs well with verbatimModuleSyntax).
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Allow void expressions as statements (e.g. `void promise.catch(...)`)
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },

  // Prettier must be last so it can turn off any formatting rules
  eslintConfigPrettier,
]);
