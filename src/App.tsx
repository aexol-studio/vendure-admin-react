import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Root } from '@/pages/Root';
import { useEffect, useState } from 'react';
import { adminApiQuery, token } from '@/common/client';
import { ProductListPage } from '@/pages/products/List';
import { CollectionsListPage } from '@/pages/collections/List';
import { useAtom } from 'jotai';
import { ProductDetailPage } from '@/pages/products/Detail/Detail';
import { OrderListPage } from '@/pages/orders/List';
import { OrderCreatePage } from './pages/orders/Create';
import { LoginScreen } from './pages/LoginScreen';
import { Dashboard } from './pages/Dashboard';
import { MarketPlaceListPage } from './pages/marketplace/List';
import { io } from 'socket.io-client';
import { ActiveAdminsAtom, LoginAtom, PluginsAtom } from './state/atoms';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'marketplace',
        element: <MarketPlaceListPage />,
      },
      {
        path: 'products',
        element: <ProductListPage />,
      },
      {
        path: 'products/:slug',
        element: <ProductDetailPage />,
      },
      {
        path: 'collections',
        element: <CollectionsListPage />,
      },
      {
        path: 'orders',
        element: <OrderListPage />,
      },
      {
        // this is not slug but for easier usage with useDetail hook I marked this as slug even its id
        path: 'orders',
        element: <OrderListPage />,
      },
      {
        path: 'orders/:id',
        element: <OrderCreatePage />,
      },
    ],
  },
]);

function App() {
  const [needSocket, setNeedSocket] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useAtom(LoginAtom);
  const [, setIsConnected] = useState(false);
  const [, setClients] = useAtom(ActiveAdminsAtom);
  const [, setPlugins] = useAtom(PluginsAtom);

  function onConnect() {
    setIsConnected(true);
  }

  function onDisconnect() {
    setIsConnected(false);
  }

  function onClients(clients) {
    setClients(
      clients
        .sort((a, b) => {
          const aMe = a.id === activeAdmin?.id;
          const bMe = b.id === activeAdmin?.id;
          if (aMe && !bMe) return -1;
          if (bMe && !aMe) return 1;
          return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        })
        .map((client) => ({ ...client, me: client.id === activeAdmin?.id })),
    );
  }

  const [activeAdmin, setActiveAdmin] = useState<{
    id: string;
    emailAddress: string;
    firstName: string;
    lastName: string;
  }>();

  useEffect(() => {
    if (token) {
      setIsLoggedIn('yes');
    } else setIsLoggedIn('no');
  }, []);

  useEffect(() => {
    const init = async () => {
      const response = await adminApiQuery()({
        globalSettings: {
          serverConfig: { plugins: { name: true, version: true, path: true, active: true, status: true } },
        },
      });
      const { activeAdministrator } = await adminApiQuery()({
        activeAdministrator: { id: true, emailAddress: true, firstName: true, lastName: true },
      });
      setActiveAdmin(activeAdministrator);
      setPlugins(response.globalSettings.serverConfig.plugins || []);
      const socket = response.globalSettings.serverConfig.plugins?.find(
        (plugin) => plugin.name === 'AexolAdminsPlugin',
      );
      if (socket?.active) setNeedSocket(true);
    };
    init();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!needSocket) return;
    const socket = io('localhost:3000');
    socket.emit('events', { ...activeAdmin, location: window.location.href, lastActive: new Date() });
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('events', onClients);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('events', onClients);
    };
  }, [needSocket]);

  return (
    <AnimatePresence>
      {isLoggedIn === 'unknown' && (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-16 h-16 animate-spin" />
        </div>
      )}
      {isLoggedIn === 'no' && <LoginScreen />}
      {isLoggedIn === 'yes' && <RouterProvider router={router} />}
    </AnimatePresence>
  );
}

export default App;
