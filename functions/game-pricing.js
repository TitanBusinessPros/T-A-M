function gameCost(gameType) {
  if (gameType === 'space') return 1;
  if (gameType === 'checkers') return 4;
  if (gameType === 'qrMaker') return 2;
  if (gameType === 'websiteMaker') return 3;
  if (gameType === 'chess') return 1;
  if (gameType === 'pinball') return 1;
  if (gameType === 'invoiceGenerator') return 2;
  if (gameType === 'match3') return 2;
  if (gameType === 'followAlong') return 2;
  return null;
}

module.exports = { gameCost };
