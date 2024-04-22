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
        <React.Suspense fallback="Loading...">
          <App />
          <Toaster
            richColors
            toastOptions={{
              unstyled: false,
              classNames: {
                toast: 'bg-blue-400',
                title: 'text-red-400',
                description: 'text-red-400',
                actionButton: 'bg-zinc-400',
                cancelButton: 'bg-orange-400',
                closeButton: 'bg-lime-400',
              },
            }}
          />
        </React.Suspense>
      </I18nextProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
