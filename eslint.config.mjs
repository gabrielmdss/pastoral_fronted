import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
export default tseslint.config(
  { ignores:['dist/**','node_modules/**','.angular/**','.angular-scaffold/**'] },
  { files:['**/*.ts'], extends:[eslint.configs.recommended,...tseslint.configs.recommended,...angular.configs.tsRecommended], processor:angular.processInlineTemplates, rules:{'@typescript-eslint/consistent-type-imports':'off','@angular-eslint/prefer-inject':'off'} },
  { files:['**/*.html'], extends:[...angular.configs.templateRecommended,...angular.configs.templateAccessibility] },
);
