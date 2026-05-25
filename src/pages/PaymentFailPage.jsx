import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import PaymentTrustStrip from '@/components/trust/PaymentTrustStrip';
import { SUPPORT_EMAIL } from '@/constants/companyInfo';

export default function PaymentFailPage() {
  const [params] = useSearchParams();
  const orderId = params.get('oid');
  const failReason = params.get('reason');

  return (
    <>
      <SEO title="Ödeme Başarısız" path="/odeme/basarisiz" noindex />
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-6 font-display text-2xl font-bold text-brand-900">Ödeme Tamamlanamadı</h1>
        <p className="mt-3 text-brand-600 leading-relaxed">
          Ödeme işlemi iptal edildi, süresi doldu veya bankanız tarafından onaylanmadı.
          Kart bilgileriniz kaydedilmedi; güvenle tekrar deneyebilirsiniz.
        </p>
        {failReason && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 max-w-md mx-auto">
            PayTR: {failReason}
          </p>
        )}
        {orderId && (
          <p className="mt-2 text-sm text-gray-500">Referans: {orderId}</p>
        )}
        <ul className="mt-6 text-left text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-xl p-4 space-y-2 max-w-md mx-auto">
          <li>• Kart limitinizi ve internet alışverişine açık olduğunu kontrol edin.</li>
          <li>• 3D Secure doğrulama adımını tamamladığınızdan emin olun.</li>
          <li>• Sorun devam ederse farklı bir kart deneyin veya bizimle iletişime geçin.</li>
        </ul>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/sepet">
            <Button variant="primary">
              <RefreshCw className="h-4 w-4" /> Tekrar Dene
            </Button>
          </Link>
          <Link to="/iletisim">
            <Button variant="secondary">
              <MessageCircle className="h-4 w-4" /> Destek Al
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-xs text-gray-500">
          Yardım:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-700 underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <PaymentTrustStrip compact className="mt-6" />
      </div>
    </>
  );
}
