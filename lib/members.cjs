const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getMemberStore } = require('./memberBlobStore.cjs');

const INDEX_KEY = 'member-index';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 32).toString('hex');
}

function createSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function publicMember(record) {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    createdAt: record.createdAt,
  };
}

function memberProfile(record) {
  return {
    ...publicMember(record),
    phone: String(record.phone || '').trim(),
    addresses: Array.isArray(record.addresses) ? record.addresses : [],
  };
}

function normalizeAddress(addr, index = 0) {
  const id = String(addr?.id || `addr-${Date.now()}-${index}`).trim();
  return {
    id,
    label: String(addr?.label || 'Adres').trim() || 'Adres',
    name: String(addr?.name || '').trim(),
    phone: String(addr?.phone || '').trim(),
    line1: String(addr?.line1 || addr?.address || '').trim(),
    city: String(addr?.city || '').trim(),
    district: String(addr?.district || '').trim(),
    postalCode: String(addr?.postalCode || '').trim(),
    isDefault: Boolean(addr?.isDefault),
  };
}

async function verifyMemberAccess(storage, memberId, email) {
  const id = String(memberId || '').trim();
  const normEmail = normalizeEmail(email);
  if (!id || !normEmail) return null;
  const record = await storage.get(`member-${id}`);
  if (!record || normalizeEmail(record.email) !== normEmail) return null;
  return record;
}

function createBlobStorage(event) {
  const store = getMemberStore(event);
  return {
    async get(key) {
      try {
        return await store.get(key, { type: 'json' });
      } catch {
        return null;
      }
    },
    async set(key, data) {
      await store.setJSON(key, data);
    },
  };
}

function createFileStorage(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const indexPath = path.join(dir, '_index.json');
  return {
    async get(key) {
      if (key === INDEX_KEY) {
        if (!fs.existsSync(indexPath)) return [];
        try {
          const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      }
      const filePath = path.join(dir, `${key}.json`);
      if (!fs.existsSync(filePath)) return null;
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        return null;
      }
    },
    async set(key, data) {
      if (key === INDEX_KEY) {
        fs.writeFileSync(indexPath, JSON.stringify(data, null, 0));
        return;
      }
      fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(data, null, 0));
    },
  };
}

async function getIndex(storage) {
  const data = await storage.get(INDEX_KEY);
  return Array.isArray(data) ? data : [];
}

async function setIndex(storage, index) {
  await storage.set(INDEX_KEY, index);
}

async function registerMember(storage, { name, email, password }) {
  const normEmail = normalizeEmail(email);
  const normName = String(name || '').trim();
  const pwd = String(password || '');

  if (!normEmail || !normName) {
    return {
      ok: false,
      status: 400,
      code: 'VALIDATION',
      error: 'Ad soyad ve e-posta zorunludur',
    };
  }
  if (pwd.length < 6) {
    return {
      ok: false,
      status: 400,
      code: 'VALIDATION',
      error: 'Şifre en az 6 karakter olmalıdır',
    };
  }

  const index = await getIndex(storage);
  if (index.some((m) => normalizeEmail(m.email) === normEmail)) {
    return {
      ok: false,
      status: 409,
      code: 'EMAIL_EXISTS',
      error: 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.',
    };
  }

  const id = `m-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const salt = createSalt();
  const createdAt = new Date().toISOString();
  const record = {
    id,
    email: normEmail,
    name: normName,
    phone: '',
    addresses: [],
    passwordHash: hashPassword(pwd, salt),
    salt,
    createdAt,
  };

  await storage.set(`member-${id}`, record);
  await setIndex(storage, [
    { id, email: normEmail, name: normName, createdAt },
    ...index,
  ]);

  return { ok: true, member: publicMember(record) };
}

async function loginMember(storage, { email, password }) {
  const normEmail = normalizeEmail(email);
  const pwd = String(password || '');

  if (!normEmail) {
    return {
      ok: false,
      status: 400,
      code: 'VALIDATION',
      error: 'E-posta zorunludur',
    };
  }

  const index = await getIndex(storage);
  const row = index.find((m) => normalizeEmail(m.email) === normEmail);

  if (!row) {
    return {
      ok: false,
      status: 404,
      code: 'NOT_REGISTERED',
      error: 'Bu e-posta adresi ile kayıtlı üye bulunamadı.',
    };
  }

  const record = await storage.get(`member-${row.id}`);
  if (!record) {
    return {
      ok: false,
      status: 404,
      code: 'NOT_REGISTERED',
      error: 'Bu e-posta adresi ile kayıtlı üye bulunamadı.',
    };
  }

  if (!pwd) {
    return {
      ok: false,
      status: 400,
      code: 'VALIDATION',
      error: 'Şifre zorunludur',
    };
  }

  if (hashPassword(pwd, record.salt) !== record.passwordHash) {
    return {
      ok: false,
      status: 401,
      code: 'WRONG_PASSWORD',
      error: 'Şifre hatalı. Tekrar deneyin.',
    };
  }

  return { ok: true, member: publicMember(record) };
}

async function listMembers(storage) {
  const index = await getIndex(storage);
  return [...index].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  );
}

async function getMemberAccount(storage, memberId, email) {
  const record = await verifyMemberAccess(storage, memberId, email);
  if (!record) {
    return { ok: false, status: 403, error: 'Oturum geçersiz' };
  }
  return { ok: true, profile: memberProfile(record) };
}

async function updateMemberAccount(storage, memberId, email, body) {
  const record = await verifyMemberAccess(storage, memberId, email);
  if (!record) {
    return { ok: false, status: 403, error: 'Oturum geçersiz' };
  }

  const normName = String(body?.name ?? record.name).trim();
  if (!normName) {
    return { ok: false, status: 400, error: 'Ad soyad zorunludur' };
  }

  let addresses = Array.isArray(body?.addresses) ? body.addresses.map(normalizeAddress) : record.addresses || [];
  if (addresses.length && !addresses.some((a) => a.isDefault)) {
    addresses = addresses.map((a, i) => ({ ...a, isDefault: i === 0 }));
  }
  if (addresses.length > 1) {
    const defaultId = addresses.find((a) => a.isDefault)?.id || addresses[0].id;
    addresses = addresses.map((a) => ({ ...a, isDefault: a.id === defaultId }));
  }

  const updated = {
    ...record,
    name: normName,
    phone: String(body?.phone ?? record.phone ?? '').trim(),
    addresses,
  };

  await storage.set(`member-${record.id}`, updated);

  const index = await getIndex(storage);
  const nextIndex = index.map((m) =>
    m.id === record.id
      ? { id: record.id, email: record.email, name: normName, createdAt: record.createdAt }
      : m,
  );
  await setIndex(storage, nextIndex);

  return { ok: true, profile: memberProfile(updated) };
}

module.exports = {
  INDEX_KEY,
  normalizeEmail,
  createBlobStorage,
  createFileStorage,
  registerMember,
  loginMember,
  listMembers,
  getMemberAccount,
  updateMemberAccount,
  verifyMemberAccess,
  publicMember,
  memberProfile,
};
