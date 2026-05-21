function allowedPasswords() {
  let buildTime = '';
  try {
    buildTime = String(require('./catalogAuth.cjs').ADMIN_PASSWORD || '').trim();
  } catch {
    buildTime = '';
  }
  return [
    process.env.ADMIN_PASSWORD,
    process.env.CATALOG_ADMIN_PASSWORD,
    process.env.VITE_ADMIN_PASSWORD,
    buildTime,
  ]
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

function verifyAdmin(headers) {
  const given = String(headers['x-admin-key'] || headers['X-Admin-Key'] || '').trim();
  if (!given) return false;
  return allowedPasswords().includes(given);
}

module.exports = { verifyAdmin, allowedPasswords };
