const MEMBERS_REGISTER = '/api/members/register';
const MEMBERS_LOGIN = '/api/members/login';
const MEMBERS_LIST = '/api/members/list';

function adminHeaders() {
  const pass =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('b2b_admin_pass') || ''
      : '';
  return {
    'Content-Type': 'application/json',
    'X-Admin-Key': pass,
  };
}

export async function registerMember({ name, email, password }) {
  const res = await fetch(MEMBERS_REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Kayıt başarısız');
    err.code = data.code;
    throw err;
  }
  return data.member;
}

export async function loginMember({ email, password }) {
  const res = await fetch(MEMBERS_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Giriş başarısız');
    err.code = data.code;
    throw err;
  }
  return data.member;
}

export async function fetchMembers() {
  const res = await fetch(MEMBERS_LIST, { headers: adminHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Üyeler yüklenemedi');
  return data.members || [];
}
