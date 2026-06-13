import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';

import { ErrorBoundary } from './components/ErrorBoundary';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Set API base URL from environment variables only (NO HARDCODED URLS)
const _apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_RENDER_URL;
if (!_apiUrl) {
  console.error('VITE_API_URL or VITE_RENDER_URL environment variable must be set');
  throw new Error('API base URL not configured. Please set VITE_API_URL or VITE_RENDER_URL environment variable.');
}
setBaseUrl(_apiUrl);
// Attach auth token to all API client requests
setAuthTokenGetter(() => localStorage.getItem('medrise_admin_token'));

// Google Analytics
if (typeof window !== 'undefined') {
  const GA_ID = import.meta.env.VITE_GA_ID || 'G-TWNMY2FCT2';

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer?.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { page_path: window.location.pathname });
}

// Service Worker registration (offline support)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[MedRise] SW registered:', reg.scope))
      .catch((err) => console.warn('[MedRise] SW registration failed:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
