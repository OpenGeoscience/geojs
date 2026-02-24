const globals = require('globals');
const neostandard = require('neostandard');
const jsdoc = require('eslint-plugin-jsdoc');

module.exports = [
  ...neostandard({
    semi: true
  }),
  jsdoc.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        sinon: true
      }
    },
    rules: {
      '@stylistic/indent': ['error', 2, {
        CallExpression: {arguments: 'first'},
        MemberExpression: 'off',
        SwitchCase: 1,
        VariableDeclarator: 2
      }],
      '@stylistic/key-spacing': 'off',
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/no-multi-spaces': 'off',
      '@stylistic/object-curly-newline': 'off',
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/object-shorthand': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/padded-blocks': 'off',
      '@stylistic/space-before-function-paren': ['error', {anonymous: 'always', named: 'never'}],
      '@stylistic/spaced-comment': 'off',
      camelcase: 'off',
      'new-cap': 'off',
      'no-loss-of-precision': 'off',
      'no-prototype-builtins': 'off',
      'no-throw-literal': 'off',
      'no-unneeded-ternary': 'off',
      'no-useless-call': 'off',
      'no-var': 'off',
      'object-shorthand': 'off',
      'one-var': 'off',
      yoda: 'off',

    }
  }, {
    files: ['examples/**', 'tutorials/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        $: true,
        CodeMirror: true,
        d3: true,
        geo: true,
        sinon: true
      }
    },
    rules: {
    }
  }, {
    files: ['tests/**'],
    languageOptions: {
      globals: {
        ...globals.jasmine,
        sinon: true
      }
    },
    rules: {
    }
  }, {
    files: ['src/**/*.js'],
    plugins: {
      jsdoc, 'jsdoc-overrides': require('./jsdoc/linting')
    },
    rules: {
      'jsdoc/check-types': ['warn', {
        unifyParentAndChildTypeChecks: true,
        noDefaults: true
      }],
      'jsdoc/require-jsdoc': ['error', {
        require: {
          FunctionDeclaration: false,
          MethodDefinition: true,
          ClassDeclaration: true
        }
      }],
      'jsdoc/check-param-names': 'off',
      'jsdoc/check-tag-names': 'off',
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/reject-any-type': 'off',
      'jsdoc/reject-function-type': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/tag-lines': 'off',
      'jsdoc/valid-types': 'off',
      'jsdoc-overrides/valid-types': 'warn',
      'no-console': 'error',
    }
  }, {
    files: ['tutorials/**', 'examples/**', 'tests/**', 'scripts/**', 'plugins/**', 'jsdoc/**'],
    rules: {
      'jsdoc/check-param-names': 'off',
      'jsdoc/check-tag-names': 'off',
      'jsdoc/check-types': 'off',
      'jsdoc/match-description': 'off',
      'jsdoc/multiline-blocks': 'off',
      'jsdoc/no-defaults': 'off',
      'jsdoc/no-multi-asterisks': 'off',
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/reject-function-type': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-check': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/tag-lines': 'off',
      'jsdoc/valid-types': 'off',
    }
  }, {
    ignores: [
      'src/util/distanceGrid.js',
      'dist/**',
      'website/**',
      '**/*.min.js',
      'jsdoc/template/publish.js',
      'jsdoc/template/static/**',
      'jsdoc/template/tmpl/**',
      '_build/**',
      'docs/_build/**',
    ]
  }
];
