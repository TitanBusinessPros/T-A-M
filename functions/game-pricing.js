function gameCost(gameType) {
  if (gameType === 'space') return 1;
  if (gameType === 'checkers') return 4;
  return null;
}

module.exports = { gameCost };
