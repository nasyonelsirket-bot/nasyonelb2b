/**
 * E-posta (Resend) yapılandırma durumu — API anahtarı gösterilmez
 */
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  const apiKeySet = !!String(process.env.RESEND_API_KEY || '').trim();
  const fromEmail = String(process.env.RESEND_FROM_EMAIL || '').trim();
  const notifyEmail = String(process.env.ORDER_NOTIFY_EMAIL || '').trim();

  const active = apiKeySet && !!fromEmail;

  let message = '';
  if (!apiKeySet) {
    message = 'RESEND_API_KEY Netlify ortam değişkenine eklenmeli.';
  } else if (!fromEmail) {
    message = 'RESEND_FROM_EMAIL tanımlı değil.';
  } else if (!notifyEmail) {
    message = 'API anahtarı var; ORDER_NOTIFY_EMAIL önerilir (size bildirim).';
  } else {
    message = 'Resend yapılandırması tamam görünüyor. Test siparişi ile doğrulayın.';
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      active,
      resendApiKeySet: apiKeySet,
      fromEmail: fromEmail || null,
      notifyEmail: notifyEmail || null,
      message,
    }),
  };
};
