const { verifyAdmin } = require('../../lib/adminAuth.cjs');
const { createBlobStorage, listMembers } = require('../../lib/members.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!verifyAdmin(event.headers)) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Yetkisiz' }) };
  }

  try {
    const storage = createBlobStorage(event);
    const members = await listMembers(storage);
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ members, count: members.length }),
    };
  } catch (err) {
    console.error('members-list:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Üye listesi alınamadı' }),
    };
  }
};
