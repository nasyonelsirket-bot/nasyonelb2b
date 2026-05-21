const COUPON_VALIDATE = '/api/coupon/validate';

export async function validateCouponRemote({ code, email, subtotal }) {
  const res = await fetch(COUPON_VALIDATE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, email, subtotal }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Kupon geçersiz');
  }
  return data;
}
