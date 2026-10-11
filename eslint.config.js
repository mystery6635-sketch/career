import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default tseslint.config(
  { ignores: ['dist', 'dist-lib', 'ds-bundle', '.ds-sync', '.design-sync', '.omc', '.vercel', 'node_modules', 'test-results', 'playwright-report', 'specs', '.specify', '.claude'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.recommended],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // API 키 서버 전용 보호: 브라우저 코드는 server/를 가져올 수 없다.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/server', '**/server/*', '**/server/**'], message: 'src는 server/를 가져올 수 없습니다(FR-040).' },
          ],
        },
      ],
    },
  },
)
