function creditsForSession(session, paymentLinkId) {
  if (!paymentLinkId || session.payment_link !== paymentLinkId) return 0;
  if (session.mode !== 'payment' || session.payment_status !== 'paid') return 0;
  if (session.currency !== 'usd' || !session.livemode) return 0;
  const subtotal = session.amount_subtotal;
  const total = session.amount_total;
  if (!Number.isSafeInteger(subtotal) || subtotal < 100 || subtotal % 100 !== 0) return 0;
  if (!Number.isSafeInteger(total) || total < subtotal) return 0;
  return subtotal / 100;
}

module.exports = { creditsForSession };
