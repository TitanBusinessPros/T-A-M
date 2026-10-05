function normalizeWebsite(value) {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!input || input.length > 512) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

module.exports = { normalizeWebsite };
