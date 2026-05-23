/** Ana thread'i bloklamadan üçüncü parti / düşük öncelikli işleri çalıştırır */
export function runWhenIdle(callback, timeoutMs = 4500) {
  if (typeof window === 'undefined') return;
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => callback(), { timeout: timeoutMs });
    return;
  }
  window.setTimeout(callback, Math.min(timeoutMs, 2000));
}

/** İlk kullanıcı etkileşiminden sonra bir kez çalıştırır (idle fallback yok — üçüncü parti scriptler için) */
export function runAfterInteraction(callback) {
  if (typeof window === 'undefined') return;
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    events.forEach((ev) => window.removeEventListener(ev, run, opts));
    callback();
  };
  const events = ['pointerdown', 'keydown', 'touchstart'];
  const opts = { once: true, passive: true, capture: true };
  events.forEach((ev) => window.addEventListener(ev, run, opts));
}

/** İlk kullanıcı etkileşiminden veya idle sonrası bir kez çalıştırır */
export function runAfterInteractionOrIdle(callback, timeoutMs = 6000) {
  if (typeof window === 'undefined') return;
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    callback();
  };
  runAfterInteraction(run);
  runWhenIdle(run, timeoutMs);
}
