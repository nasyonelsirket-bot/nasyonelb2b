/**
 * Netlify Functions (Lambda uyumluluk) için Blobs store.
 * getStore öncesi connectLambda(event) zorunludur.
 */
const { connectLambda, getStore } = require('@netlify/blobs');

const STORE_NAME = 'b2b-catalog';

function connectCatalogBlobs(event) {
  if (event?.blobs) {
    connectLambda(event);
    return;
  }
  if (process.env.NETLIFY_BLOBS_CONTEXT) {
    return;
  }
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token =
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_API_TOKEN;
  if (siteID && token) {
    return;
  }
  throw new Error(
    'Netlify Blobs bağlamı bulunamadı. Site Netlify üzerinde deploy edilmiş olmalı; netlify dev ile test edin.',
  );
}

function getCatalogStore(event) {
  connectCatalogBlobs(event);
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

module.exports = { getCatalogStore, STORE_NAME };
