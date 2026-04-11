const http = require('http');
const { exec } = require('child_process');

/**
 * Execute an `ls` shell command using the provided input and log its stdout.
 * @param {string} userInput - String appended to the `ls` command and passed to the shell; its contents become part of the executed command.
 */
function runCommand(userInput) {
  exec('ls ' + userInput, (err, stdout) => {
    console.log(stdout);
  });
}

/**
 * Retrieve a user record matching the provided id from the users table.
 * @param {(string|number)} id - The user id to match in the users table.
 * @returns {*} The result returned by the database query.
 */
function getUser(id) {
  const query = "SELECT * FROM users WHERE id = '" + id + "'";
  return db.query(query);
}

/**
 * Create an H1 greeting HTML string that includes the provided name.
 * @param {string} name - The name to insert into the greeting; this value is inserted verbatim without escaping.
 * @returns {string} An HTML string like `<h1>Hello NAME</h1>` where `NAME` is the provided name.
 */
function renderPage(name) {
  return '<h1>Hello ' + name + '</h1>';
}

/**
 * Read a file from the module's /data directory and return its raw contents.
 * @param {string} filename - The filename appended to '/data/' to form the path to read.
 * @returns {Buffer} The file contents as a Buffer.
 */
function readFile(filename) {
  return fs.readFileSync('/data/' + filename);
}

var unused_var = 'test';
var another_unused = 42;
