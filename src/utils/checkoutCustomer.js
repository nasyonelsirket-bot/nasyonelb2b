import { loadFromStorage, saveToStorage } from '@/utils/storage';

export const CHECKOUT_CUSTOMER_KEY = 'nt_checkout_customer';

export const EMPTY_CHECKOUT_CUSTOMER = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  district: '',
};

/** Teslimat adresi form alanları — tek kaynak (CartPage + admin önizleme) */
export const DELIVERY_FIELDS = [
  { key: 'name', label: 'Ad Soyad', type: 'text', autoComplete: 'name', half: false },
  { key: 'phone', label: 'Telefon', type: 'tel', autoComplete: 'tel', half: true },
  { key: 'email', label: 'E-posta', type: 'email', autoComplete: 'email', half: true },
  {
    key: 'address',
    label: 'Adres',
    type: 'textarea',
    autoComplete: 'street-address',
    half: false,
  },
  { key: 'city', label: 'İl', type: 'text', autoComplete: 'address-level1', half: true },
  { key: 'district', label: 'İlçe', type: 'text', autoComplete: 'address-level2', half: true },
];

export function normalizeCheckoutCustomer(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_CHECKOUT_CUSTOMER };
  }
  const out = { ...EMPTY_CHECKOUT_CUSTOMER };
  for (const { key } of DELIVERY_FIELDS) {
    if (key in raw) out[key] = String(raw[key] ?? '');
  }
  return out;
}

export function isCheckoutCustomerComplete(c) {
  if (!c) return false;
  return Boolean(
    String(c.name || '').trim() &&
      String(c.phone || '').trim() &&
      String(c.email || '').trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email).trim()) &&
      String(c.address || '').trim() &&
      String(c.city || '').trim() &&
      String(c.district || '').trim(),
  );
}

export function customerFromMemberProfile(profile) {
  if (!profile) return null;
  const addresses = Array.isArray(profile.addresses) ? profile.addresses : [];
  const def = addresses.find((a) => a.isDefault) || addresses[0];
  const email = String(profile.email || '').trim();
  const phone = String(def?.phone || profile.phone || '').trim();
  const name = String(def?.name || profile.name || '').trim();
  const address = String(def?.line1 || '').trim();
  const city = String(def?.city || '').trim();
  const district = String(def?.district || '').trim();

  if (!email && !phone && !name) return null;

  return {
    name,
    phone,
    email,
    address,
    city,
    district,
  };
}

export function loadSavedCheckoutCustomer() {
  const raw = loadFromStorage(CHECKOUT_CUSTOMER_KEY, null);
  if (!raw || typeof raw !== 'object') return null;
  return { ...EMPTY_CHECKOUT_CUSTOMER, ...raw };
}

export function saveCheckoutCustomer(customer) {
  if (!isCheckoutCustomerComplete(customer)) return;
  saveToStorage(CHECKOUT_CUSTOMER_KEY, {
    name: String(customer.name || '').trim(),
    phone: String(customer.phone || '').trim(),
    email: String(customer.email || '').trim(),
    address: String(customer.address).trim(),
    city: String(customer.city || '').trim(),
    district: String(customer.district || '').trim(),
  });
}

export function resolveCartCustomerPrefill({ profile, isLoggedIn }) {
  if (isLoggedIn && profile) {
    const fromMember = customerFromMemberProfile(profile);
    if (isCheckoutCustomerComplete(fromMember)) {
      return { customer: fromMember, source: 'member' };
    }
  }
  const saved = loadSavedCheckoutCustomer();
  if (isCheckoutCustomerComplete(saved)) {
    return { customer: saved, source: 'local' };
  }
  return { customer: { ...EMPTY_CHECKOUT_CUSTOMER }, source: null };
}
