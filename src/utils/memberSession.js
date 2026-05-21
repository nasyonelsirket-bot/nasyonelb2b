const SESSION_KEY = 'nt_member_session';

export function saveMemberSession(member) {
  if (!member?.id) return;
  const payload = {
    id: member.id,
    email: member.email,
    name: member.name,
    createdAt: member.createdAt,
  };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    localStorage.setItem('nt_member_email', payload.email || '');
    localStorage.setItem('nt_member_name', payload.name || '');
  } catch {
    /* ignore */
  }
}

export function getMemberSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.id || !data?.email) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearMemberSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('nt_member_email');
    localStorage.removeItem('nt_member_name');
  } catch {
    /* ignore */
  }
}
