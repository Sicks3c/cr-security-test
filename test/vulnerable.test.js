'use strict';

const { describe, it, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Setup – intercept child_process.exec BEFORE vulnerable.js is first required.
// Because vulnerable.js destructures exec at load time (`const { exec } = ...`),
// we must place our mock on the cached child_process module before that require
// fires.  Modifying the property on the already-cached module achieves this.
// ---------------------------------------------------------------------------

const childProcess = require('child_process');
const originalExec = childProcess.exec;
const mockExec = mock.fn();
childProcess.exec = mockExec; // inject before vulnerable.js is required

const { runCommand, getUser, renderPage, readFile } = require('../src/vulnerable');

// Restore the real exec after all tests (cleanup for other test files).
after(() => {
  childProcess.exec = originalExec;
});

// ---------------------------------------------------------------------------
// renderPage – pure string-building function, no external deps
// ---------------------------------------------------------------------------
describe('renderPage', () => {
  it('wraps the name in an <h1> tag', () => {
    assert.equal(renderPage('Alice'), '<h1>Hello Alice</h1>');
  });

  it('returns the correct structure for an empty string name', () => {
    assert.equal(renderPage(''), '<h1>Hello </h1>');
  });

  it('does NOT escape HTML – demonstrating XSS vulnerability', () => {
    const payload = '<script>alert(1)</script>';
    const result = renderPage(payload);
    assert.equal(result, '<h1>Hello <script>alert(1)</script></h1>');
    assert.ok(result.includes('<script>'), 'raw script tag should be present (unescaped)');
  });

  it('does NOT escape HTML attribute injection payloads', () => {
    const payload = '"><img src=x onerror=alert(1)>';
    const result = renderPage(payload);
    assert.equal(result, '<h1>Hello "><img src=x onerror=alert(1)></h1>');
  });

  it('coerces numeric input to string via concatenation', () => {
    assert.equal(renderPage(42), '<h1>Hello 42</h1>');
  });

  it('preserves special characters such as apostrophes', () => {
    assert.equal(renderPage("O'Brien"), "<h1>Hello O'Brien</h1>");
  });

  it('always begins with the literal prefix "<h1>Hello "', () => {
    assert.ok(renderPage('World').startsWith('<h1>Hello '));
  });

  it('always ends with the closing </h1> tag', () => {
    assert.ok(renderPage('World').endsWith('</h1>'));
  });
});

// ---------------------------------------------------------------------------
// runCommand – wraps child_process.exec
// ---------------------------------------------------------------------------
describe('runCommand', () => {
  beforeEach(() => {
    mockExec.mock.resetCalls();
  });

  it('calls exec exactly once per invocation', () => {
    runCommand('somedir');
    assert.equal(mockExec.mock.calls.length, 1);
  });

  it('prepends "ls " to the user input', () => {
    runCommand('somedir');
    assert.equal(mockExec.mock.calls[0].arguments[0], 'ls somedir');
  });

  it('passes a callback function as the second argument to exec', () => {
    runCommand('foo');
    assert.equal(typeof mockExec.mock.calls[0].arguments[1], 'function');
  });

  it('handles an empty string input', () => {
    runCommand('');
    assert.equal(mockExec.mock.calls[0].arguments[0], 'ls ');
  });

  it('does NOT sanitize input – demonstrates command injection via semicolon', () => {
    runCommand('; cat /etc/passwd');
    const cmd = mockExec.mock.calls[0].arguments[0];
    assert.equal(cmd, 'ls ; cat /etc/passwd');
    assert.ok(cmd.includes(';'), 'semicolon shell metacharacter should be present unescaped');
  });

  it('does NOT sanitize input – demonstrates command injection via &&', () => {
    runCommand('&& whoami');
    const cmd = mockExec.mock.calls[0].arguments[0];
    assert.equal(cmd, 'ls && whoami');
    assert.ok(cmd.includes('&&'));
  });

  it('does NOT sanitize input – demonstrates subshell injection via $()', () => {
    runCommand('$(id)');
    const cmd = mockExec.mock.calls[0].arguments[0];
    assert.equal(cmd, 'ls $(id)');
    assert.ok(cmd.includes('$('));
  });

  it('uses string concatenation (not array form) – all input lands in one shell string', () => {
    runCommand('a b c');
    const cmd = mockExec.mock.calls[0].arguments[0];
    assert.equal(typeof cmd, 'string');
    assert.ok(cmd.startsWith('ls '));
  });
});

// ---------------------------------------------------------------------------
// getUser – builds a SQL query and calls db.query (db is an implicit global)
// ---------------------------------------------------------------------------
describe('getUser', () => {
  let mockDbQuery;

  before(() => {
    mockDbQuery = mock.fn(() => [{ id: 1, name: 'Alice' }]);
    global.db = { query: mockDbQuery };
  });

  after(() => {
    delete global.db;
  });

  beforeEach(() => {
    mockDbQuery.mock.resetCalls();
  });

  it('calls db.query exactly once', () => {
    getUser(1);
    assert.equal(mockDbQuery.mock.calls.length, 1);
  });

  it('builds a SELECT query targeting the users table', () => {
    getUser(1);
    const query = mockDbQuery.mock.calls[0].arguments[0];
    assert.ok(query.includes('SELECT'), 'query must contain SELECT');
    assert.ok(query.includes('users'), 'query must reference the users table');
  });

  it('interpolates the id directly into the query string', () => {
    getUser(42);
    const query = mockDbQuery.mock.calls[0].arguments[0];
    assert.equal(query, "SELECT * FROM users WHERE id = '42'");
  });

  it('returns the result from db.query', () => {
    const result = getUser(1);
    assert.deepEqual(result, [{ id: 1, name: 'Alice' }]);
  });

  it('handles an empty string id', () => {
    getUser('');
    const query = mockDbQuery.mock.calls[0].arguments[0];
    assert.equal(query, "SELECT * FROM users WHERE id = ''");
  });

  it('does NOT sanitize input – demonstrates SQL injection via OR 1=1', () => {
    const injection = "1' OR '1'='1";
    getUser(injection);
    const query = mockDbQuery.mock.calls[0].arguments[0];
    assert.equal(query, "SELECT * FROM users WHERE id = '1' OR '1'='1'");
    assert.ok(query.includes("OR '1'='1'"), 'injected OR clause should be present unescaped');
  });

  it('does NOT sanitize input – demonstrates UNION-based SQL injection', () => {
    const injection = "0' UNION SELECT username,password FROM admins--";
    getUser(injection);
    const query = mockDbQuery.mock.calls[0].arguments[0];
    assert.ok(query.includes('UNION SELECT'), 'UNION injection should be unescaped');
  });

  it('does NOT sanitize input – demonstrates stacked query injection', () => {
    const injection = "1'; DROP TABLE users;--";
    getUser(injection);
    const query = mockDbQuery.mock.calls[0].arguments[0];
    assert.ok(query.includes('DROP TABLE'), 'stacked query injection should be unescaped');
  });
});

// ---------------------------------------------------------------------------
// readFile – builds a path and calls fs.readFileSync (fs is an implicit global)
// ---------------------------------------------------------------------------
describe('readFile', () => {
  let mockReadFileSync;

  before(() => {
    mockReadFileSync = mock.fn(() => Buffer.from('file contents'));
    global.fs = { readFileSync: mockReadFileSync };
  });

  after(() => {
    delete global.fs;
  });

  beforeEach(() => {
    mockReadFileSync.mock.resetCalls();
  });

  it('calls fs.readFileSync exactly once per invocation', () => {
    readFile('report.txt');
    assert.equal(mockReadFileSync.mock.calls.length, 1);
  });

  it('prepends the base directory /data/ to the filename', () => {
    readFile('report.txt');
    assert.equal(mockReadFileSync.mock.calls[0].arguments[0], '/data/report.txt');
  });

  it('returns the value from fs.readFileSync', () => {
    const result = readFile('report.txt');
    assert.deepEqual(result, Buffer.from('file contents'));
  });

  it('handles an empty filename – calls readFileSync with "/data/"', () => {
    readFile('');
    assert.equal(mockReadFileSync.mock.calls[0].arguments[0], '/data/');
  });

  it('handles filenames with no directory component', () => {
    readFile('notes.txt');
    assert.equal(mockReadFileSync.mock.calls[0].arguments[0], '/data/notes.txt');
  });

  it('does NOT sanitize input – demonstrates single-level path traversal', () => {
    readFile('../etc/passwd');
    const path = mockReadFileSync.mock.calls[0].arguments[0];
    assert.equal(path, '/data/../etc/passwd');
    assert.ok(path.includes('..'), 'traversal sequence should be present unescaped');
  });

  it('does NOT sanitize input – demonstrates deep path traversal', () => {
    readFile('../../../../etc/shadow');
    const path = mockReadFileSync.mock.calls[0].arguments[0];
    assert.equal(path, '/data/../../../../etc/shadow');
    assert.ok(path.includes('../..'), 'deep traversal should be unescaped');
  });

  it('does NOT sanitize input – demonstrates traversal to arbitrary log files', () => {
    readFile('../../var/log/syslog');
    const path = mockReadFileSync.mock.calls[0].arguments[0];
    assert.ok(path.startsWith('/data/'), 'base prefix should remain');
    assert.ok(path.endsWith('syslog'), 'target filename should be present');
    assert.ok(path.includes('../'), 'traversal dots should be unescaped');
  });
});