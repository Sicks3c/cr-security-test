const http = require('http');
const { exec } = require('child_process');

// Obvious command injection
function runCommand(userInput) {
  exec('ls ' + userInput, (err, stdout) => {
    console.log(stdout);
  });
}

// SQL injection
function getUser(id) {
  const query = "SELECT * FROM users WHERE id = '" + id + "'";
  return db.query(query);
}

// XSS
function renderPage(name) {
  return '<h1>Hello ' + name + '</h1>';
}

// Path traversal
function readFile(filename) {
  return fs.readFileSync('/data/' + filename);
}

var unused_var = 'test';
var another_unused = 42;
