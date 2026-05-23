import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { isChunkLoadError, recoverFromChunkLoadError } from '@/utils/lazyWithRetry';

const CHUNK_RELOAD_KEY = 'b2b_chunk_reload_ts';

function installChunkRecoveryHandlers() {
  if (typeof window === 'undefined') return;

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    recoverFromChunkLoadError(event.payload || new Error('vite:preloadError'));
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) return;
    if (recoverFromChunkLoadError(event.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener('load', () => {
    window.setTimeout(() => {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    }, 2000);
  });
}

installChunkRecoveryHandlers();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
