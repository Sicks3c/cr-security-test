// ESLint flat config - JavaScript module executed when loaded by ESLint
// This config adds a custom rule that prepends a marker to all diagnostics

const MARKER = '[ESLINT-EXEC-CONFIRMED]';

// Side-channel: if this config is loaded by ESLint (not just statically analyzed),
// the custom plugin's create() function will fire during linting.
const customPlugin = {
  rules: {
    'exec-canary': {
      meta: {
        type: 'problem',
        docs: { description: 'Canary rule to confirm ESLint execution' },
        schema: []
      },
      create(context) {
        // This function only runs if ESLint actually loads and executes the config
        return {
          Program(node) {
            context.report({
              node,
              message: `${MARKER} ESLint flat config was loaded and executed server-side`
            });
          }
        };
      }
    }
  }
};

export default [
  {
    files: ["**/*.js", "**/*.mjs"],
    plugins: {
      'canary': customPlugin
    },
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "canary/exec-canary": "error"
    }
  }
];
