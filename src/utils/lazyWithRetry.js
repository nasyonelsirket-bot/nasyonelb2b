import { lazy } from 'react';

const CHUNK_RELOAD_KEY = 'b2b_chunk_reload_ts';
const CHUNK_RELOAD_COOLDOWN_MS = 15000;

/** Dynamic import / chunk load hatalarını tanır */
export function isChunkLoadError(error) {
  const msg = String(error?.message || error || '');
  return (
    error?.name === 'ChunkLoadError' ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('is not a valid JavaScript MIME type') ||
    msg.includes('error loading dynamically imported module')
  );
}

function shouldHardReloadForChunkError() {
  if (typeof window === 'undefined') return false;
  const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
  if (last && Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) return false;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  return true;
}

/** Stale deploy sonrası chunk 404 → HTML yerine bir kez hard reload */
export function recoverFromChunkLoadError(error) {
  if (!isChunkLoadError(error)) return false;
  if (!shouldHardReloadForChunkError()) return false;

  const url = new URL(window.location.href);
  url.searchParams.set('_cb', String(Date.now()));
  window.location.replace(url.toString());
  return true;
}

/**
 * React.lazy wrapper — chunk load fail'de kısa retry, ardından tek hard reload.
 */
export function lazyWithRetry(importFn, retries = 2) {
  return lazy(async () => {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const mod = await importFn();
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        }
        return mod;
      } catch (err) {
        lastError = err;
        if (!isChunkLoadError(err) || attempt >= retries) break;
        await new Promise((resolve) => {
          window.setTimeout(resolve, 300 * (attempt + 1));
        });
      }
    }

    if (recoverFromChunkLoadError(lastError)) {
      return new Promise(() => {});
    }
    throw lastError;
  });
}
