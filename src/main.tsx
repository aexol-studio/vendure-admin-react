import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastsProvider, themeColors } from '@aexol-studio/styling-system';
import { ThemeProvider } from '@emotion/react';
const t = themeColors('billabee', 'light');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={t}>
      <ToastsProvider>
        <App />
      </ToastsProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
