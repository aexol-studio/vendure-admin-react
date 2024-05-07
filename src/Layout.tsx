import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { adminApiQuery } from '@/common/client';
import { LoginScreen } from './pages/LoginScreen.tsx';
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
import { I18nextProvider, useTranslation } from 'react-i18next';
import { toast, Toaster } from 'sonner';
import i18n from './i18.ts';
import { router } from '@/utils';

const TAKE = 100;
const getAllPaginatedCountries = async () => {
  let countries: { code: string; name: string }[] = [];
  let totalItems = 0;
  let skip = 0;
  do {
    const {
      countries: { items, totalItems: total },
    } = await adminApiQuery({
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
    } = await adminApiQuery({
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

export const Layout = () => {
  const isLoggedIn = useSettings((p) => p.isLoggedIn);
  const theme = useSettings((p) => p.theme);

  const { t } = useTranslation('common');
  const setActiveAdministrator = useServer((p) => p.setActiveAdministrator);
  const setServerConfig = useServer((p) => p.setServerConfig);
  const setCountries = useServer((p) => p.setCountries);
  const setFulfillmentHandlers = useServer((p) => p.setFulfillmentHandlers);
  const setPaymentMethodsType = useServer((p) => p.setPaymentMethodsType);

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
          adminApiQuery({ globalSettings: { serverConfig: serverConfigSelector } }),
          adminApiQuery({ activeAdministrator: activeAdministratorSelector }),
          getAllPaginatedCountries(),
          getAllPaymentMethods(),
          adminApiQuery({ fulfillmentHandlers: configurableOperationDefinitionSelector }),
        ]);
        if (serverConfigResponse.status === 'rejected') {
          toast.error(t('setup.failedServer'));
        } else {
          setServerConfig(serverConfigResponse.value.globalSettings.serverConfig);
          // const socket = serverConfigResponse.value.globalSettings.serverConfig.plugins?.find(
          //   (plugin) => plugin.name === 'AexolAdminsPlugin',
          // );
          // if (socket && socket.active) setNeedSocket(true);
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

  // useEffect(() => {
  //   if (!needSocket) return;
  //   const socket = io('localhost:3000');
  //   socket.emit('events', { ...activeAdministrator, location: window.location.href, lastActive: new Date() });
  //   socket.on('connect', onConnect);
  //   socket.on('disconnect', onDisconnect);
  //   socket.on('events', onClients);
  //   return () => {
  //     socket.off('connect', onConnect);
  //     socket.off('disconnect', onDisconnect);
  //     socket.off('events', onClients);
  //   };
  // }, [needSocket]);

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
};
