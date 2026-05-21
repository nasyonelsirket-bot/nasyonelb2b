const { createBlobStorage, registerMember } = require('../../lib/members.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz JSON' }) };
  }

  try {
    const storage = createBlobStorage(event);
    const result = await registerMember(storage, body);
    if (!result.ok) {
      return {
        statusCode: result.status,
        headers: HEADERS,
        body: JSON.stringify({ error: result.error, code: result.code }),
      };
    }
    return {
      statusCode: 201,
      headers: HEADERS,
      body: JSON.stringify({ ok: true, member: result.member }),
    };
  } catch (err) {
    console.error('members-register:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Kayıt başarısız' }),
    };
  }
};
