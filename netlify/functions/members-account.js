const { createBlobStorage, getMemberAccount, updateMemberAccount } = require('../../lib/members.cjs');
const { readMemberAuth } = require('../../lib/memberRequestAuth.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Member-Id, X-Member-Email',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  const { memberId, email } = readMemberAuth(event);
  if (!memberId || !email) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Giriş gerekli' }) };
  }

  const storage = createBlobStorage(event);

  if (event.httpMethod === 'GET') {
    try {
      const result = await getMemberAccount(storage, memberId, email);
      if (!result.ok) {
        return {
          statusCode: result.status,
          headers: HEADERS,
          body: JSON.stringify({ error: result.error }),
        };
      }
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ ok: true, profile: result.profile }),
      };
    } catch (err) {
      console.error('members-account GET:', err);
      return {
        statusCode: 500,
        headers: HEADERS,
        body: JSON.stringify({ error: err.message || 'Profil alınamadı' }),
      };
    }
  }

  if (event.httpMethod === 'PUT') {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz JSON' }) };
    }
    try {
      const result = await updateMemberAccount(storage, memberId, email, body);
      if (!result.ok) {
        return {
          statusCode: result.status,
          headers: HEADERS,
          body: JSON.stringify({ error: result.error }),
        };
      }
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ ok: true, profile: result.profile }),
      };
    } catch (err) {
      console.error('members-account PUT:', err);
      return {
        statusCode: 500,
        headers: HEADERS,
        body: JSON.stringify({ error: err.message || 'Profil güncellenemedi' }),
      };
    }
  }

  return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
};
