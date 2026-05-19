/**
 * Sipariş PDF dosyaları — Netlify Blobs (Lambda uyumluluk).
 */
const { connectLambda, getStore } = require('@netlify/blobs');

const STORE_NAME = 'b2b-orders';

function connectOrderBlobs(event) {
  if (event?.blobs) {
    connectLambda(event);
    return;
  }
  if (process.env.NETLIFY_BLOBS_CONTEXT) return;
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token =
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_API_TOKEN;
  if (siteID && token) return;
  throw new Error('Netlify Blobs bağlamı bulunamadı');
}

function getOrderStore(event) {
  connectOrderBlobs(event);
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token =
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_API_TOKEN;
  if (siteID && token && !event?.blobs && !process.env.NETLIFY_BLOBS_CONTEXT) {
    return getStore({ name: STORE_NAME, siteID, token, consistency: 'eventual' });
  }
  return getStore({ name: STORE_NAME, consistency: 'eventual' });
}

module.exports = { getOrderStore, STORE_NAME };
