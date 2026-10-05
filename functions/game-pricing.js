function gameCost(gameType) {
  if (gameType === 'space') return 1;
  if (gameType === 'checkers') return 4;
  if (gameType === 'qrMaker') return 2;
  return null;
}

module.exports = { gameCost };
