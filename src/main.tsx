import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastsProvider, themeColors } from '@aexol-studio/styling-system';
import { ThemeProvider } from '@emotion/react';
import i18n from './i18.ts';
import { I18nextProvider } from 'react-i18next';

const t = themeColors('billabee', 'light');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={t}>
      <ToastsProvider>
        <I18nextProvider i18n={i18n} defaultNS={'translation'}>
          <React.Suspense fallback="loading...">
            <App />
          </React.Suspense>
        </I18nextProvider>
      </ToastsProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
