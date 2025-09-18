module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  env: {
    node: true,
    es2022: true
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: ['tsconfig.base.json', 'packages/*/tsconfig.json', 'services/*/tsconfig.json', 'apps/*/tsconfig.json']
      }
    }
  },
  ignorePatterns: ['dist', 'build']
};
