import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import { analytics } from './lib/firebase';

// Sentry — monitoreo de errores en producción
// Configura VITE_SENTRY_DSN en tu .env con el DSN de tu proyecto en sentry.io
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });
}

// Inicializar Firebase Analytics (es una promesa, no bloquea el render)
analytics.catch(() => null);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={
      <div className="h-screen flex flex-col items-center justify-center text-center p-8">
        <p className="text-2xl font-black text-red-500 mb-2">¡Algo salió mal!</p>
        <p className="text-sm text-gray-500">El error fue reportado automáticamente.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
        >
          Recargar la app
        </button>
      </div>
    }>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
