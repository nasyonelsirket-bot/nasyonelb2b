import { getMemberSession } from '@/utils/memberSession';

const MEMBERS_REGISTER = '/api/members/register';
const MEMBERS_LOGIN = '/api/members/login';
const MEMBERS_LIST = '/api/members/list';
const MEMBERS_ACCOUNT = '/api/members/account';
const MEMBERS_ORDERS = '/api/members/orders';

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

function memberHeaders() {
  const session = getMemberSession();
  if (!session?.id || !session?.email) return null;
  return {
    'Content-Type': 'application/json',
    'X-Member-Id': session.id,
    'X-Member-Email': session.email,
  };
}

export async function fetchMemberAccount() {
  const headers = memberHeaders();
  if (!headers) throw new Error('Giriş gerekli');
  const res = await fetch(MEMBERS_ACCOUNT, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Hesap bilgisi alınamadı');
  return data.profile;
}

export async function updateMemberAccount(payload) {
  const headers = memberHeaders();
  if (!headers) throw new Error('Giriş gerekli');
  const res = await fetch(MEMBERS_ACCOUNT, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Profil güncellenemedi');
  return data.profile;
}

export async function fetchMemberOrders() {
  const headers = memberHeaders();
  if (!headers) throw new Error('Giriş gerekli');
  const res = await fetch(MEMBERS_ORDERS, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Siparişler yüklenemedi');
  return data.orders || [];
}

export async function fetchMemberOrderDetail(orderId) {
  const headers = memberHeaders();
  if (!headers) throw new Error('Giriş gerekli');
  const res = await fetch(`${MEMBERS_ORDERS}?id=${encodeURIComponent(orderId)}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Sipariş detayı alınamadı');
  return data.order;
}
