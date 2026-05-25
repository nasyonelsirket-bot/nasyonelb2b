const LOG_PREFIX = '[PayTR iframe]';

export function logPaytrIframeEvent(type, detail = {}) {
  console.log(`${LOG_PREFIX} ${type}`, detail);
}

/** CSP / X-Frame console mesajlarını yakalar (securitypolicyviolation) */
export function logPaytrCspViolation(event) {
  console.error(`${LOG_PREFIX} CSP/X-Frame violation`, {
    blockedURI: event.blockedURI,
    violatedDirective: event.violatedDirective,
    effectiveDirective: event.effectiveDirective,
    originalPolicy: event.originalPolicy,
    disposition: event.disposition,
    sourceFile: event.sourceFile,
    lineNumber: event.lineNumber,
    columnNumber: event.columnNumber,
    sample: event.sample,
    statusCode: event.statusCode,
  });
}

export function attachPaytrIframeDebugListeners() {
  const onViolation = (event) => logPaytrCspViolation(event);
  document.addEventListener('securitypolicyviolation', onViolation);
  return () => document.removeEventListener('securitypolicyviolation', onViolation);
}

export function redactPaytrIframeUrl(url) {
  if (!url) return url;
  return String(url).replace(/(\/guvenli\/)[^/?#]+/, '$1[token]');
}
