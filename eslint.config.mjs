import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylisticTs from '@stylistic/eslint-plugin-ts'
import tsParser from '@typescript-eslint/parser'

export default [
    pluginJs.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    ...tseslint.configs.strictTypeChecked,
    {
        ignores: ['dist/*', 'eslint.config.mjs', '**/*.d.ts', 'tsup.config.js', '**/*.js', 'test/*'],
    },
    {
        files: ['**/*.ts'],
        plugins: {
            '@stylistic/ts': stylisticTs,
        },
        rules: {
            '@stylistic/ts/indent': ['error', 4],
            '@stylistic/ts/no-extra-semi': ['error'],
            '@stylistic/ts/quotes': ['error', 'single', {
                'avoidEscape': true,
                'allowTemplateLiterals': true,
                'ignoreStringLiterals': true,
            }],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            // Disabling no-explicit-any due to the nature of this package, which is designed to literally be used with any type
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                ecmaVersion: 'latest',
                ecmaFeatures: { modules: true },

            },
        },
    },
]