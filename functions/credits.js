function creditsForSession(session) {
  if (!session.payment_link || !/^plink_[A-Za-z0-9]+$/.test(session.payment_link)) return 0;
  if (session.mode !== 'payment' || session.payment_status !== 'paid') return 0;
  if (session.currency !== 'usd' || !session.livemode) return 0;
  const subtotal = session.amount_subtotal;
  const total = session.amount_total;
  if (subtotal !== 500 || total !== 500) return 0;
  return 5;
}

module.exports = { creditsForSession };
