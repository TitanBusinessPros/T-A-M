const { createHash } = require('node:crypto');

const ADMIN_EMAIL = 'titanbusinesspros@gmail.com';

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function emailKey(email) {
  return createHash('sha256').update(email).digest('hex');
}

function isAdmin(token) {
  return token?.firebase?.sign_in_provider === 'google.com'
    && token.email_verified === true
    && normalizeEmail(token.email) === ADMIN_EMAIL;
}

function grantAmount(value) {
  return Number.isSafeInteger(value) && value >= 1 && value <= 100 ? value : null;
}

module.exports = { emailKey, grantAmount, isAdmin, normalizeEmail };
