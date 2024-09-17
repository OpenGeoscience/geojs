module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 0-disable, 1-warn, 2-error
    'subject-case': [0],
    // These are the standard values, but are listed here for easier reference
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test'
      ]
    ],
    'body-max-line-length': [
      2,
      'always',
      Infinity
    ]
  }
};
