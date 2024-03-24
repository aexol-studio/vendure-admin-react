import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './App.css';
import i18n from './i18.ts';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '@/theme/useTheme.tsx';
import { Toaster } from '@/components/ui/sonner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <I18nextProvider i18n={i18n} defaultNS={'translation'}>
        <React.Suspense fallback="loading...">
          <App />
          <Toaster />
        </React.Suspense>
      </I18nextProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
