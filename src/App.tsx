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
import {
  activeAdministratorSelector,
  configurableOperationDefinitionSelector,
  paymentMethodsSelector,
  PaymentMethodsType,
  serverConfigSelector,
} from '@/graphql/base';
import { useServer } from '@/state/server';
import { countrySelector } from '@/graphql/base';
import { toast } from 'sonner';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './i18.ts';

const TAKE = 100;
const getAllPaginatedCountries = async () => {
  let countries: { code: string; name: string }[] = [];
  let totalItems = 0;
  let skip = 0;
  do {
    const {
      countries: { items, totalItems: total },
    } = await adminApiQuery()({
      countries: [{ options: { skip, take: TAKE } }, { items: countrySelector, totalItems: true }],
    });
    countries = [...countries, ...items];
    totalItems = total;
    skip += TAKE;
  } while (countries.length < totalItems);
  return { countries };
};

const getAllPaymentMethods = async () => {
  let paymentMethods: PaymentMethodsType[] = [];
  let totalItems = 0;
  let skip = 0;
  do {
    const {
      paymentMethods: { items, totalItems: total },
    } = await adminApiQuery()({
      paymentMethods: [
        { options: { skip, take: TAKE, filter: { enabled: { eq: true } } } },
        { items: paymentMethodsSelector, totalItems: true },
      ],
    });
    paymentMethods = [...paymentMethods, ...items];
    totalItems = total;
    skip += TAKE;
  } while (paymentMethods.length < totalItems);
  return { paymentMethods };
};

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
  const theme = useSettings((p) => p.theme);

  const { t } = useTranslation('common');
  const [needSocket, setNeedSocket] = useState(false);
  const setActiveAdministrator = useServer((p) => p.setActiveAdministrator);
  const setActiveClients = useServer((p) => p.setActiveClients);
  const setServerConfig = useServer((p) => p.setServerConfig);
  const setCountries = useServer((p) => p.setCountries);
  const setIsConnected = useServer((p) => p.setIsConnected);
  const setFulfillmentHandlers = useServer((p) => p.setFulfillmentHandlers);
  const setPaymentMethodsType = useServer((p) => p.setPaymentMethodsType);
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
      if (isLoggedIn) {
        const [
          serverConfigResponse,
          activeAdministratorResponse,
          countriesResponse,
          paymentsResponse,
          fulfillmentsResponse,
        ] = await Promise.allSettled([
          adminApiQuery()({ globalSettings: { serverConfig: serverConfigSelector } }),
          adminApiQuery()({ activeAdministrator: activeAdministratorSelector }),
          getAllPaginatedCountries(),
          getAllPaymentMethods(),
          adminApiQuery()({ fulfillmentHandlers: configurableOperationDefinitionSelector }),
        ]);
        if (serverConfigResponse.status === 'rejected') {
          toast.error(t('setup.failedServer'));
        } else {
          setServerConfig(serverConfigResponse.value.globalSettings.serverConfig);
          const socket = serverConfigResponse.value.globalSettings.serverConfig.plugins?.find(
            (plugin) => plugin.name === 'AexolAdminsPlugin',
          );
          if (socket && socket.active) setNeedSocket(true);
        }
        if (activeAdministratorResponse.status === 'rejected') {
          toast.error(t('setup.failedAdmin'));
        } else {
          setActiveAdministrator(activeAdministratorResponse.value.activeAdministrator);
        }
        if (countriesResponse.status === 'rejected') {
          toast.error(t('setup.failedCountries'));
        } else {
          setCountries(countriesResponse.value.countries);
        }
        if (paymentsResponse.status === 'rejected') {
          toast.error(t('setup.failedPayments'));
        } else {
          setPaymentMethodsType(paymentsResponse.value.paymentMethods);
        }
        if (fulfillmentsResponse.status === 'rejected') {
          toast.error(t('setup.failedFulfillments'));
        } else {
          setFulfillmentHandlers(fulfillmentsResponse.value.fulfillmentHandlers);
        }
      }
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
      <AnimatePresence>{isLoggedIn ? <RouterProvider router={router} /> : <LoginScreen />}</AnimatePresence>;
    </I18nextProvider>
  );
}

export default App;
