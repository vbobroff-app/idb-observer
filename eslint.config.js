import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

import tsparser from '@typescript-eslint/parser';
import eslimport from 'eslint-plugin-import';

import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    plugins: { import: eslimport },
  },
  {
    ignores: ['.eslintrc.js', 'webpack.config.js'],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parser: tsparser,
    },
  },

  pluginJs.configs.recommended,
  pluginPrettierRecommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      semi: 'warn',
      'prettier/prettier': ['warn', { singleQuote: true, printWidth: 180, experimentalTernaries: true, endOfLine: 'auto' }],
      indent: ['warn', 2, { SwitchCase: 1, offsetTernaryExpressions: true, flatTernaryExpressions: true }],
      'no-unused-vars': 'warn',
      'arrow-parens': 'warn',
      'no-unused-expressions': 'off',
      'prefer-destructuring': 'off',
      'no-restricted-syntax': 'off',
      'click-events-have-key-events': 'off',
      'no-noninteractive-element-interactions': 'off',
      'max-len': [
        'error',
        {
          code: 255,
          ignoreTrailingComments: true,
          ignoreUrls: true,
        },
      ],
      'no-continue': 'off',
      'no-underscore-dangle': ['off', { allowFunctionParams: true }],
      'no-plusplus': ['warn', { allowForLoopAfterthoughts: true }],
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'typescript-sort-keys/interface': 'off',
      'import/prefer-default-export': 'off',
      'import/no-extraneous-dependencies': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'linebreak-style': 0,
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];
