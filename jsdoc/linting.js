module.exports.rules = {
  'valid-types': {
    meta: {
      docs: {
        description: 'Override jsdoc/valid-types to ignore typedef names',
        category: 'Best Practices',
        recommended: false,
      },
      type: 'problem',
      fixable: null,
      schema: [], // we just delegate to original rule
    },
    create(context) {
      // Load the original rule
      const originalRule = require('eslint-plugin-jsdoc').rules['valid-types'];
      const original = originalRule.create(context);
      return {
        JSDoc: (node) => {
          const tags = (node.tags || []).filter(tag => {
            if (tag.tag !== 'typedef') return true;
            return (tag.name || '').startsWith('geo.');
          });
          if (tags.length) original.JSDoc({ ...node, tags });
        },
      };
    },
  },
};
