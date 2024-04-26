import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './App.css';
import { Toaster } from '@/components/ui/sonner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
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
  </React.StrictMode>,
);
