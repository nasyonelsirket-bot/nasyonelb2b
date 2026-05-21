import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import { useMember } from '@/context/MemberContext';
import { updateMemberAccount } from '@/services/memberApi';

const EMPTY = {
  label: 'Ev',
  name: '',
  phone: '',
  line1: '',
  city: '',
  district: '',
  postalCode: '',
  isDefault: false,
};

export default function AccountAddressesPage() {
  const { profile, refreshProfile } = useMember();
  const [addresses, setAddresses] = useState(() => profile?.addresses || []);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!editing) setAddresses(profile?.addresses || []);
  }, [profile, editing]);

  const syncFromProfile = () => {
    setAddresses(profile?.addresses || []);
  };

  const startAdd = () => {
    setEditing('new');
    setForm({
      ...EMPTY,
      name: profile?.name || '',
      isDefault: addresses.length === 0,
    });
  };

  const startEdit = (addr) => {
    setEditing(addr.id);
    setForm({ ...addr });
  };

  const cancel = () => {
    setEditing(null);
    setForm(EMPTY);
    syncFromProfile();
  };

  const saveAll = async (nextAddresses) => {
    setSaving(true);
    setMsg('');
    try {
      await updateMemberAccount({
        name: profile?.name,
        phone: profile?.phone,
        addresses: nextAddresses,
      });
      await refreshProfile();
      setAddresses(nextAddresses);
      setEditing(null);
      setForm(EMPTY);
      setMsg('Adresler kaydedildi');
    } catch (err) {
      setMsg(err.message || 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const submitForm = (e) => {
    e.preventDefault();
    const entry = {
      ...form,
      id: editing === 'new' ? `addr-${Date.now()}` : editing,
    };
    let next = [...addresses];
    if (editing === 'new') {
      next.push(entry);
    } else {
      next = next.map((a) => (a.id === editing ? entry : a));
    }
    if (entry.isDefault) {
      next = next.map((a) => ({ ...a, isDefault: a.id === entry.id }));
    }
    saveAll(next);
  };

  const remove = (id) => {
    const next = addresses.filter((a) => a.id !== id);
    if (next.length && !next.some((a) => a.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    saveAll(next);
  };

  const setDefault = (id) => {
    const next = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    saveAll(next);
  };

  return (
    <>
      <SEO title="Adreslerim" path="/hesabim/adreslerim" />
      <div className="space-y-4">
        <div className="rounded-2xl border border-brand-100 bg-white shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-600" />
              <h2 className="font-display font-bold text-brand-900">Adreslerim</h2>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={startAdd}>
              <Plus className="h-4 w-4" />
              Yeni adres
            </Button>
          </div>

          {addresses.length === 0 && !editing && (
            <p className="p-6 text-sm text-gray-500 text-center">
              Kayıtlı adres yok. Siparişlerinizde kullanmak için adres ekleyin.
            </p>
          )}

          <ul className="divide-y divide-brand-50">
            {addresses.map((addr) => (
              <li key={addr.id} className="p-5">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-900 flex items-center gap-2">
                      {addr.label}
                      {addr.isDefault && (
                        <span className="text-[10px] uppercase bg-accent-gold/30 text-brand-900 px-1.5 py-0.5 rounded">
                          Varsayılan
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{addr.name}</p>
                    <p className="text-sm text-gray-600">{addr.line1}</p>
                    <p className="text-sm text-gray-600">
                      {[addr.district, addr.city, addr.postalCode].filter(Boolean).join(' · ')}
                    </p>
                    {addr.phone && <p className="text-sm text-gray-500 mt-1">{addr.phone}</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => setDefault(addr.id)}
                        className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <Star className="h-3 w-3" /> Varsayılan yap
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(addr)}
                      className="text-xs text-brand-700 hover:underline"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(addr.id)}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Sil
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {editing && (
          <form
            onSubmit={submitForm}
            className="rounded-2xl border border-brand-200 bg-white p-5 shadow-card space-y-3"
          >
            <h3 className="font-semibold text-brand-900">
              {editing === 'new' ? 'Yeni adres' : 'Adresi düzenle'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Adres başlığı</label>
                <input
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                  placeholder="Ev, İş..."
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Alıcı adı</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Telefon</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500">Adres</label>
                <input
                  required
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">İlçe</label>
                <input
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">İl</label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Posta kodu</label>
                <input
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-brand-800 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                Varsayılan adres
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button type="button" variant="outline" onClick={cancel}>
                İptal
              </Button>
            </div>
          </form>
        )}

        {msg && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{msg}</p>}
      </div>
    </>
  );
}
