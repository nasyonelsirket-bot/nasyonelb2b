function parseEnvBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

/** OAuth (Google / Facebook / Apple) — varsayılan kapalı */
export const ENABLE_SOCIAL_LOGIN = parseEnvBool(import.meta.env.VITE_ENABLE_SOCIAL_LOGIN, false);
