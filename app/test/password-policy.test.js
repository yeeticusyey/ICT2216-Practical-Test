import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePasswordSyntax } from '../src/password-policy.js';

test('accepts a 10-character printable ASCII passphrase', () => {
  assert.deepEqual(validatePasswordSyntax('good pass!'), []);
});

test('rejects a password shorter than 10 characters', () => {
  assert.deepEqual(validatePasswordSyntax('short'), ['Password must contain at least 10 characters.']);
});

test('rejects non-ASCII characters', () => {
  assert.match(validatePasswordSyntax('longpassword🔒').join(' '), /printable ASCII/);
});
