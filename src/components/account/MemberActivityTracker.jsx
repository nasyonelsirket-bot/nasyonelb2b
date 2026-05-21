import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { touchMemberSession, getMemberSession } from '@/utils/memberSession';

/**
 * Üye oturumu: her sayfa gezinmesi ve sekme odağında aktivite yenilenir.
 * 24 saat işlem yoksa oturum düşer; kullanıcı çıkış yapana kadar (aktifken) açık kalır.
 */
export default function MemberActivityTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (getMemberSession()) touchMemberSession();
  }, [pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && getMemberSession()) {
        touchMemberSession();
      }
    };
    const onActivity = () => {
      if (getMemberSession()) touchMemberSession();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('click', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });

    const interval = setInterval(() => {
      if (getMemberSession()) touchMemberSession();
    }, 5 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('keydown', onActivity);
      clearInterval(interval);
    };
  }, []);

  return null;
}
