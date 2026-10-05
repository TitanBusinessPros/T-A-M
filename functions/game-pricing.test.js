const { test } = require('node:test');
const assert = require('node:assert/strict');
const { gameCost } = require('./game-pricing');

test('game creation uses the advertised credit costs and rejects unknown types', () => {
  assert.equal(gameCost('space'), 1);
  assert.equal(gameCost('checkers'), 4);
  assert.equal(gameCost('websiteMaker'), 3);
  assert.equal(gameCost('chess'), 1);
  assert.equal(gameCost('qrMaker'), 2);
  assert.equal(gameCost(''), null);
  assert.equal(gameCost('other'), null);
});
