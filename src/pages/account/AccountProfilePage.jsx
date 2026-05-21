import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import { useMember } from '@/context/MemberContext';
import { updateMemberAccount } from '@/services/memberApi';

export default function AccountProfilePage() {
  const { profile, refreshProfile } = useMember();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateMemberAccount({
        name: name.trim(),
        phone: phone.trim(),
        addresses: profile?.addresses || [],
      });
      await refreshProfile();
      setMsg('Profiliniz güncellendi');
    } catch (err) {
      setMsg(err.message || 'Güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SEO title="Profilim" path="/hesabim/profilim" />
      <div className="rounded-2xl border border-brand-100 bg-white shadow-card overflow-hidden max-w-lg">
        <div className="px-5 py-4 border-b border-brand-50 flex items-center gap-2">
          <User className="h-5 w-5 text-brand-600" />
          <h2 className="font-display font-bold text-brand-900">Profilim</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-brand-800">E-posta</label>
            <input
              type="email"
              readOnly
              value={profile?.email || ''}
              className="mt-1 w-full rounded-lg border border-brand-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600"
            />
            <p className="text-[11px] text-gray-500 mt-1">E-posta değişikliği için iletişime geçin.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-brand-800">Ad Soyad</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-800">Telefon</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm"
              placeholder="05xx xxx xx xx"
            />
          </div>
          {profile?.createdAt && (
            <p className="text-xs text-gray-500">
              Üyelik:{' '}
              {new Date(profile.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          {msg && (
            <p
              className={`text-sm rounded-lg px-3 py-2 ${
                msg.includes('güncellendi')
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-red-700 bg-red-50'
              }`}
            >
              {msg}
            </p>
          )}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
          </Button>
        </form>
      </div>
    </>
  );
}
