import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Root } from '@/pages/Root';
import { useEffect, useState } from 'react';
import { adminApiQuery } from '@/common/client';
import { ProductListPage } from '@/pages/products/List';
import { CollectionsListPage } from '@/pages/collections/List';
import { ProductDetailPage } from '@/pages/products/Detail/Detail';
import { OrderListPage } from '@/pages/orders/List';
import { OrderCreatePage } from './pages/orders/Create';
import { LoginScreen } from './pages/LoginScreen';
import { Dashboard } from './pages/Dashboard';
import { MarketPlaceListPage } from './pages/marketplace/List';
import { io } from 'socket.io-client';
import { AnimatePresence } from 'framer-motion';
import { useSettings } from '@/state/settings';
import { activeAdministratorSelector, serverConfigSelector } from '@/graphql/draft_order';
import { useServer } from '@/state/server';

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
  const isLoggedIn = useSettings((p) => p.isLoggedIn);

  const [needSocket, setNeedSocket] = useState(false);
  const setActiveAdministrator = useServer((p) => p.setActiveAdministrator);
  const setActiveClients = useServer((p) => p.setActiveClients);
  const setServerConfig = useServer((p) => p.setServerConfig);
  const setIsConnected = useServer((p) => p.setIsConnected);
  const activeAdministrator = useServer((p) => p.activeAdministrator);

  function onConnect() {
    setIsConnected(true);
  }

  function onDisconnect() {
    setIsConnected(false);
  }

  function onClients(clients) {
    setActiveClients(
      clients
        .sort((a, b) => {
          const aMe = a.id === activeAdministrator?.id;
          const bMe = b.id === activeAdministrator?.id;
          if (aMe && !bMe) return -1;
          if (bMe && !aMe) return 1;
          return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        })
        .map((client) => ({ ...client, me: client.id === activeAdministrator?.id })),
    );
  }

  useEffect(() => {
    const init = async () => {
      const response = await adminApiQuery()({ globalSettings: { serverConfig: serverConfigSelector } });
      const { activeAdministrator } = await adminApiQuery()({ activeAdministrator: activeAdministratorSelector });

      setActiveAdministrator(activeAdministrator);
      setServerConfig(response.globalSettings.serverConfig);
      const socket = response.globalSettings.serverConfig.plugins?.find(
        (plugin) => plugin.name === 'AexolAdminsPlugin',
      );
      if (socket && socket.active) setNeedSocket(true);
    };
    init();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!needSocket) return;
    const socket = io('localhost:3000');
    socket.emit('events', { ...activeAdministrator, location: window.location.href, lastActive: new Date() });
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('events', onClients);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('events', onClients);
    };
  }, [needSocket]);

  return <AnimatePresence>{isLoggedIn ? <RouterProvider router={router} /> : <LoginScreen />}</AnimatePresence>;
}

export default App;
