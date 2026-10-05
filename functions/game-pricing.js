function gameCost(gameType) {
  if (gameType === 'space') return 1;
  if (gameType === 'checkers') return 4;
  if (gameType === 'qrMaker') return 2;
  if (gameType === 'websiteMaker') return 3;
  return null;
}

module.exports = { gameCost };
