const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emailKey, grantAmount, isAdmin, normalizeEmail } = require('./admin-credits');

test('only the verified Google admin email has admin access', () => {
  const token = {
    email: 'TitanBusinessPros@gmail.com', email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
  };
  assert.equal(isAdmin(token), true);
  assert.equal(isAdmin({ ...token, email_verified: false }), false);
  assert.equal(isAdmin({ ...token, email: 'other@gmail.com' }), false);
  assert.equal(isAdmin({ ...token, firebase: { sign_in_provider: 'password' } }), false);
});

test('email keys are stable after normalization and do not expose the email', () => {
  const email = normalizeEmail(' Person+test@Example.com ');
  assert.equal(email, 'person+test@example.com');
  assert.equal(emailKey(email), emailKey(normalizeEmail('PERSON+TEST@example.com')));
  assert.equal(emailKey(email).includes(email), false);
  assert.equal(normalizeEmail('bad address@example.com'), null);
});

test('each grant must be an integer from 1 through 100', () => {
  for (const amount of [1, 100]) assert.equal(grantAmount(amount), amount);
  for (const amount of [0, 101, 1.5, '10', null]) assert.equal(grantAmount(amount), null);
});
