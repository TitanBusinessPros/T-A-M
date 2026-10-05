const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeWebsite } = require('./website');

test('company links become web URLs and unsafe schemes are rejected', () => {
  assert.equal(normalizeWebsite(' example.com '), 'https://example.com/');
  assert.equal(normalizeWebsite('https://example.com/contact'), 'https://example.com/contact');
  assert.equal(normalizeWebsite('javascript:alert(1)'), null);
  assert.equal(normalizeWebsite('https://user:pass@example.com'), null);
  assert.equal(normalizeWebsite('not a website'), null);
});
