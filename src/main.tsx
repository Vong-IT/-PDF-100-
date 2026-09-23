// Safeguard against getter-only fetch in iframe environments
if (typeof window !== 'undefined') {
  try {
    let _nativeFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get: () => _nativeFetch,
      set: (fn) => {
        _nativeFetch = fn;
      },
      configurable: true,
      enumerable: true,
    });
  } catch (_e) {
    // Ignore if already set or unconfigurable
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
