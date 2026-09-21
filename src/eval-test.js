// Test file that should trigger ESLint's no-eval rule
// If CodeRabbit runs ESLint with the flat config, it will report:
// 1. no-eval violation on line 7
// 2. canary/exec-canary on the Program node

function processUserInput(input) {
  const result = eval(input);
  return result;
}

module.exports = { processUserInput };
