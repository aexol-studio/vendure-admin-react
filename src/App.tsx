import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { LoginScreen } from './pages/LoginScreen.tsx';
import { AnimatePresence } from 'framer-motion';
import { useSettings } from '@/state/settings';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'sonner';
import { router } from '@/utils';

import i18n from './i18.ts';

function App() {
  const isLoggedIn = useSettings((p) => p.isLoggedIn);
  const theme = useSettings((p) => p.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <I18nextProvider i18n={i18n} defaultNS={'translation'}>
      <AnimatePresence>{isLoggedIn ? <RouterProvider router={router} /> : <LoginScreen />}</AnimatePresence>
      <Toaster
        theme={theme}
        richColors
        toastOptions={{
          closeButton: true,
          classNames: {
            error: 'border',
            warning: 'border',
            success: 'border',
            info: 'border',
            default: 'border',
          },
        }}
      />
    </I18nextProvider>
  );
}

export default App;
