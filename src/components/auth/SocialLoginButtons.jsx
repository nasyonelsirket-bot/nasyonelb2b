import { ENABLE_SOCIAL_LOGIN } from '@/constants/featureFlags';

const PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'apple', label: 'Apple' },
];

/**
 * @param {'login' | 'register'} mode
 */
export default function SocialLoginButtons({ mode = 'login' }) {
  if (!ENABLE_SOCIAL_LOGIN) return null;

  const isLogin = mode === 'login';
  const caption = isLogin ? 'Hızlı kayıt (yakında aktif)' : 'veya (yakında)';
  const action = isLogin ? 'devam et' : 'kayıt ol';

  return (
    <div className="mt-8 space-y-2">
      <p className="text-xs text-center text-gray-500">{caption}</p>
      <div className="grid grid-cols-1 gap-2">
        {PROVIDERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            disabled
            className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-400 bg-gray-50"
          >
            {label} ile {action}
          </button>
        ))}
      </div>
    </div>
  );
}
