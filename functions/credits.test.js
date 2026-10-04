const { test } = require('node:test');
const assert = require('node:assert/strict');
const { creditsForSession } = require('./credits');

const paid = {
  payment_link: 'plink_credits', mode: 'payment', payment_status: 'paid',
  currency: 'usd', livemode: true, amount_subtotal: 500, amount_total: 500,
};

test('paid $5 payment link becomes five credits', () => {
  assert.equal(creditsForSession(paid), 5);
});

test('unpaid, discounted, test, and unrelated payments do not become credits', () => {
  assert.equal(creditsForSession({ ...paid, payment_status: 'unpaid' }), 0);
  assert.equal(creditsForSession({ ...paid, amount_total: 400 }), 0);
  assert.equal(creditsForSession({ ...paid, livemode: false }), 0);
  assert.equal(creditsForSession({ ...paid, payment_link: null }), 0);
  assert.equal(creditsForSession({ ...paid, amount_subtotal: 550 }), 0);
});
