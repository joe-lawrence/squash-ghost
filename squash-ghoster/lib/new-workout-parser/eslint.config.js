import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': ['error', 'never'],
      'arrow-spacing': 'error',
      'comma-dangle': ['error', 'always-multiline'],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'space-before-blocks': 'error',
      'keyword-spacing': 'error',
      'space-infix-ops': 'error',
      'comma-spacing': 'error',
      'brace-style': ['error', '1tbs'],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      radix: 'error',
      yoda: 'error',
    },
  },
  {
    // Configuration for test files - allow console statements
    files: ['test-*.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Configuration for error-handling.js - allow console statements for debugging
    files: ['error-handling.js'],
    rules: {
      'no-console': 'warn',
    },
  },
  {
    // Configuration for validation.js - disable quotes rule to avoid conflicts with Prettier
    files: ['validation.js'],
    rules: {
      quotes: 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      '*.min.js',
      '*.bundle.js',
      'coverage/',
      '.git/',
      '.DS_Store',
      '*.log',
      'test-runner.js',
    ],
  },
];
