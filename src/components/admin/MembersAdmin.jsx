import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, Mail, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import { fetchMembers } from '@/services/memberApi';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function MembersAdmin({ showMsg }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchMembers();
      setMembers(Array.isArray(list) ? list : []);
    } catch (err) {
      showMsg(err.message || 'Üye listesi alınamadı', 'error');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [showMsg]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = members.filter((m) => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return true;
    return (
      String(m.name || '')
        .toLocaleLowerCase('tr')
        .includes(q) ||
      String(m.email || '')
        .toLocaleLowerCase('tr')
        .includes(q)
    );
  });

  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-accent-gold">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-brand-900 text-lg">Üyeler</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Sitede kayıt olan müşteriler. Giriş yapmayan e-postalar burada görünmez.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ad veya e-posta ara..."
          className="flex-1 min-w-[200px] rounded-lg border border-brand-200 px-3 py-2 text-sm"
        />
        <span className="text-sm text-gray-600 font-medium">
          {filtered.length} / {members.length} üye
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 border border-dashed border-brand-200 rounded-xl p-8 text-center">
          {members.length === 0
            ? 'Henüz kayıtlı üye yok. Müşteriler /kayit sayfasından üye olabilir.'
            : 'Arama sonucu bulunamadı.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brand-100">
          <table className="w-full text-sm text-left">
            <thead className="bg-brand-50 text-brand-800 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Ad Soyad</th>
                <th className="px-4 py-3 font-semibold">E-posta</th>
                <th className="px-4 py-3 font-semibold">Kayıt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-brand-900">
                    <span className="inline-flex items-center gap-2">
                      <User className="h-4 w-4 text-brand-400 shrink-0" />
                      {m.name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <a
                      href={`mailto:${m.email}`}
                      className="inline-flex items-center gap-2 hover:text-brand-700 break-all"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-brand-400" />
                      {m.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(m.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
