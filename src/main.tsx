import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Manage Progressive Web App (PWA) Service Worker
try {
  if ('serviceWorker' in navigator) {
    if ((import.meta as any).env?.DEV) {
      // In development mode, unregister active service workers and clear caches to prevent stale chunk conflicts
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
    } else {
      window.addEventListener('load', () => {
        try {
          navigator.serviceWorker.register('/sw.js').then((reg) => {
            reg.update().catch(() => {});
          }).catch((error) => {
            console.warn('PWA Service Worker registration failed:', error);
          });
        } catch (err) {
          console.warn('Service worker registration error:', err);
        }
      });
    }
  }
} catch (err) {
  console.warn('Service worker handling bypassed:', err);
}
