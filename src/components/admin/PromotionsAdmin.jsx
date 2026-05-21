import { useState, useCallback } from 'react';
import { Tag, Ticket, Gift, Plus, Trash2, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useStore } from '@/context/StoreContext';
import { CAMPAIGN_TYPES, normalizePromotions, normalizeCode } from '@/utils/promotions';
import { askPublishPassword } from '@/services/catalogApi';
import BundleRulesAdmin from '@/components/admin/BundleRulesAdmin';

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function PromotionsAdmin({ showMsg }) {
  const store = useStore();
  const [promos, setPromos] = useState(() => normalizePromotions(store.settings.promotions));

  const saveLocal = useCallback(
    (next) => {
      const normalized = normalizePromotions(next);
      setPromos(normalized);
      store.updateSettings({ promotions: normalized });
    },
    [store],
  );

  const publish = async () => {
    const pass = askPublishPassword();
    if (!pass) {
      showMsg('Yayınlama iptal edildi', 'error');
      return;
    }
    try {
      sessionStorage.setItem('b2b_admin_pass', pass);
      store.updateSettings({ promotions: promos });
      await store.publishCatalog(pass);
      showMsg('Kampanya ve kuponlar siteye yayınlandı');
    } catch (err) {
      showMsg(err.message || 'Yayınlanamadı', 'error');
    }
  };

  const [campForm, setCampForm] = useState({
    title: '',
    type: 'percent_cart',
    description: '',
    percent: 10,
    buyQty: 2,
    payQty: 1,
    active: true,
  });

  const addCampaign = () => {
    if (!campForm.title.trim()) {
      showMsg('Kampanya başlığı gerekli', 'error');
      return;
    }
    const next = {
      ...promos,
      campaigns: [
        ...promos.campaigns,
        {
          id: newId('camp'),
          type: campForm.type,
          title: campForm.title.trim(),
          description: campForm.description.trim(),
          active: campForm.active,
          percent: Number(campForm.percent) || 0,
          buyQty: Number(campForm.buyQty) || 2,
          payQty: Number(campForm.payQty) || 1,
        },
      ],
    };
    saveLocal(next);
    setCampForm({ title: '', type: 'percent_cart', description: '', percent: 10, buyQty: 2, payQty: 1, active: true });
    showMsg('Kampanya eklendi — Siteye Yayınla ile canlıya alın');
  };

  const [cupForm, setCupForm] = useState({
    code: '',
    type: 'percent',
    value: 10,
    minSubtotal: 0,
    maxUses: 0,
    label: '',
    restrictedEmail: '',
    expiresAt: '',
    active: true,
  });

  const addCoupon = () => {
    const code = normalizeCode(cupForm.code);
    if (!code) {
      showMsg('Kupon kodu gerekli', 'error');
      return;
    }
    if (promos.coupons.some((c) => normalizeCode(c.code) === code)) {
      showMsg('Bu kod zaten var', 'error');
      return;
    }
    const next = {
      ...promos,
      coupons: [
        {
          id: newId('cup'),
          code,
          type: cupForm.type,
          value: Number(cupForm.value) || 0,
          minSubtotal: Number(cupForm.minSubtotal) || 0,
          maxUses: Number(cupForm.maxUses) || 0,
          usedCount: 0,
          label: cupForm.label.trim() || code,
          restrictedEmail: cupForm.restrictedEmail.trim(),
          expiresAt: cupForm.expiresAt ? new Date(cupForm.expiresAt).toISOString() : '',
          active: cupForm.active,
          createdAt: new Date().toISOString(),
        },
        ...promos.coupons,
      ],
    };
    saveLocal(next);
    setCupForm({
      code: '',
      type: 'percent',
      value: 10,
      minSubtotal: 0,
      maxUses: 0,
      label: '',
      restrictedEmail: '',
      expiresAt: '',
      active: true,
    });
    showMsg('Kupon eklendi');
  };

  const genCode = () => {
    const raw = `NT${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setCupForm((f) => ({ ...f, code: raw }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-brand-900 flex items-center gap-2">
            <Tag className="h-5 w-5" /> Kampanyalar & Kuponlar
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Trendyol tarzı kampanya tanımları, manuel kuponlar ve teslim sonrası otomatik 2. sipariş kuponu.
          </p>
        </div>
        <Button type="button" variant="gold" onClick={publish} disabled={store.publishing}>
          <Save className="h-4 w-4" />
          {store.publishing ? 'Yayınlanıyor...' : 'Siteye Yayınla'}
        </Button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h3 className="font-bold text-brand-900">Genel indirim ayarları</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            ['ibanDiscountPercent', 'Havale/EFT indirim %'],
            ['freeShippingThreshold', 'Ücretsiz kargo eşiği (TL)'],
            ['standardShippingFee', 'Standart kargo ücreti (TL)'],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="text-xs text-gray-500">{label}</span>
              <input
                type="number"
                value={promos[key] ?? ''}
                onChange={(e) => saveLocal({ ...promos, [key]: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 shadow-card space-y-3">
        <h3 className="font-bold text-emerald-900 flex items-center gap-2">
          <Gift className="h-5 w-5" /> Teslim sonrası otomatik kupon
        </h3>
        <p className="text-sm text-emerald-800">
          Kargolar bölümünde sipariş <strong>Teslim edildi</strong> yapılınca müşteriye e-postaya özel tek kullanımlık
          kupon oluşturulur.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={promos.deliveryReward?.enabled !== false}
            onChange={(e) =>
              saveLocal({
                ...promos,
                deliveryReward: { ...promos.deliveryReward, enabled: e.target.checked },
              })
            }
          />
          Otomatik kupon aktif
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ['percent', 'İndirim %'],
            ['minSubtotal', 'Min. sepet (TL)'],
            ['validDays', 'Geçerlilik (gün)'],
            ['codePrefix', 'Kod öneki (TESLIM)'],
            ['label', 'Etiket'],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="text-xs text-gray-600">{label}</span>
              <input
                value={promos.deliveryReward?.[key] ?? ''}
                onChange={(e) =>
                  saveLocal({
                    ...promos,
                    deliveryReward: {
                      ...promos.deliveryReward,
                      [key]: key === 'label' || key === 'codePrefix' ? e.target.value : Number(e.target.value),
                    },
                  })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
          ))}
        </div>
      </div>

      <BundleRulesAdmin store={store} promos={promos} saveLocal={saveLocal} showMsg={showMsg} />

      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h3 className="font-bold">Diğer kampanya tanımları ({promos.campaigns.length})</h3>
        <ul className="space-y-2">
          {promos.campaigns.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-brand-50 pb-2">
              <div>
                <p className="font-medium text-brand-900">
                  {c.title}{' '}
                  <span className="text-xs text-gray-500">
                    ({CAMPAIGN_TYPES.find((t) => t.id === c.type)?.label || c.type})
                  </span>
                </p>
                <p className="text-xs text-gray-600">{c.description}</p>
                {!c.active && <span className="text-xs text-amber-700">Pasif</span>}
              </div>
              <button
                type="button"
                className="text-red-600"
                onClick={() =>
                  saveLocal({ ...promos, campaigns: promos.campaigns.filter((x) => x.id !== c.id) })
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium">Yeni kampanya</p>
          <input
            placeholder="Başlık"
            value={campForm.title}
            onChange={(e) => setCampForm({ ...campForm, title: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={campForm.type}
            onChange={(e) => setCampForm({ ...campForm, type: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {CAMPAIGN_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Açıklama"
            rows={2}
            value={campForm.description}
            onChange={(e) => setCampForm({ ...campForm, description: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <Button type="button" variant="primary" onClick={addCampaign}>
            <Plus className="h-4 w-4" /> Kampanya ekle
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <Ticket className="h-5 w-5" /> Kuponlar ({promos.coupons.length})
        </h3>
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {promos.coupons.map((c) => (
            <li key={c.id} className="text-sm border-b border-brand-50 pb-2 flex justify-between gap-2">
              <div>
                <code className="font-mono font-bold text-brand-800">{c.code}</code>
                <span className="text-gray-600 ml-2">
                  {c.type === 'fixed' ? `${c.value} TL` : `%${c.value}`}
                  {c.restrictedEmail ? ` · ${c.restrictedEmail}` : ''}
                </span>
                {c.trigger === 'after_delivery' && (
                  <span className="block text-xs text-emerald-700">Otomatik (teslim)</span>
                )}
                <span className="text-xs text-gray-500 block">
                  Kullanım: {c.usedCount || 0}
                  {c.maxUses ? ` / ${c.maxUses}` : ''}
                </span>
              </div>
              <button
                type="button"
                className="text-red-600 shrink-0"
                onClick={() =>
                  saveLocal({ ...promos, coupons: promos.coupons.filter((x) => x.id !== c.id) })
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="sm:col-span-2 flex gap-2">
            <input
              placeholder="Kupon kodu"
              value={cupForm.code}
              onChange={(e) => setCupForm({ ...cupForm, code: e.target.value })}
              className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono uppercase"
            />
            <Button type="button" variant="secondary" onClick={genCode}>
              Kod üret
            </Button>
          </label>
          <select
            value={cupForm.type}
            onChange={(e) => setCupForm({ ...cupForm, type: e.target.value })}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="percent">Yüzde</option>
            <option value="fixed">Sabit TL</option>
          </select>
          <input
            type="number"
            placeholder="Değer"
            value={cupForm.value}
            onChange={(e) => setCupForm({ ...cupForm, value: e.target.value })}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Min. sepet TL"
            value={cupForm.minSubtotal}
            onChange={(e) => setCupForm({ ...cupForm, minSubtotal: e.target.value })}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Max kullanım (0=sınırsız)"
            value={cupForm.maxUses}
            onChange={(e) => setCupForm({ ...cupForm, maxUses: e.target.value })}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="E-posta kısıtı (boş=herkes)"
            value={cupForm.restrictedEmail}
            onChange={(e) => setCupForm({ ...cupForm, restrictedEmail: e.target.value })}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={cupForm.expiresAt}
            onChange={(e) => setCupForm({ ...cupForm, expiresAt: e.target.value })}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <Button type="button" variant="primary" className="sm:col-span-2" onClick={addCoupon}>
            <Plus className="h-4 w-4" /> Kupon oluştur
          </Button>
        </div>
      </div>
    </div>
  );
}
