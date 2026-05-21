const SESSION_KEY = 'nt_member_session';
/** 24 saat işlem yapılmazsa oturum kapanır */
export const MEMBER_IDLE_MS = 24 * 60 * 60 * 1000;

function readRaw() {
  try {
    let raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) localStorage.setItem(SESSION_KEY, raw);
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(data) {
  const payload = JSON.stringify(data);
  try {
    localStorage.setItem(SESSION_KEY, payload);
    sessionStorage.setItem(SESSION_KEY, payload);
    if (data?.email) {
      localStorage.setItem('nt_member_email', data.email);
      localStorage.setItem('nt_member_name', data.name || '');
    }
  } catch {
    /* ignore */
  }
}

export function touchMemberSession() {
  const data = readRaw();
  if (!data?.id || !data?.email) return;
  data.lastActivityAt = Date.now();
  writeRaw(data);
}

export function saveMemberSession(member) {
  if (!member?.id) return;
  const payload = {
    id: member.id,
    email: member.email,
    name: member.name,
    createdAt: member.createdAt,
    lastActivityAt: Date.now(),
  };
  writeRaw(payload);
}

export function getMemberSession() {
  const data = readRaw();
  if (!data?.id || !data?.email) return null;

  const last = Number(data.lastActivityAt) || 0;
  if (last && Date.now() - last > MEMBER_IDLE_MS) {
    clearMemberSession();
    return null;
  }

  if (!last) {
    data.lastActivityAt = Date.now();
    writeRaw(data);
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    createdAt: data.createdAt,
  };
}

export function clearMemberSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('nt_member_email');
    localStorage.removeItem('nt_member_name');
  } catch {
    /* ignore */
  }
}
