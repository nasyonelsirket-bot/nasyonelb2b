function readMemberAuth(event) {
  const headers = event.headers || {};
  const memberId = String(
    headers['x-member-id'] || headers['X-Member-Id'] || '',
  ).trim();
  const email = String(
    headers['x-member-email'] || headers['X-Member-Email'] || '',
  ).trim();
  return { memberId, email };
}

module.exports = { readMemberAuth };
