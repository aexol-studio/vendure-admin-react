import { Layout } from '@/common/Layout';
import { Menu } from '@/common/Menu';
import { apiCall } from '@/graphql/client';
import {
  serverConfigSelector,
  activeAdministratorSelector,
  configurableOperationDefinitionSelector,
  PaymentMethodsType,
  paymentMethodsSelector,
  countrySelector,
} from '@/graphql/base';
import { useServer } from '@/state';
import styled from '@emotion/styled';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { toast } from 'sonner';

const TAKE = 100;
const getAllPaginatedCountries = async () => {
  let countries: { code: string; name: string }[] = [];
  let totalItems = 0;
  let skip = 0;
  do {
    const {
      countries: { items, totalItems: total },
    } = await apiCall('query')({
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
    } = await apiCall('query')({
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

export const Root = () => {
  const { t } = useTranslation('common');

  const setActiveAdministrator = useServer((p) => p.setActiveAdministrator);
  const setServerConfig = useServer((p) => p.setServerConfig);
  const setCountries = useServer((p) => p.setCountries);
  const setFulfillmentHandlers = useServer((p) => p.setFulfillmentHandlers);
  const setPaymentMethodsType = useServer((p) => p.setPaymentMethodsType);

  useEffect(() => {
    const init = async () => {
      const [
        serverConfigResponse,
        activeAdministratorResponse,
        countriesResponse,
        paymentsResponse,
        fulfillmentsResponse,
      ] = await Promise.allSettled([
        apiCall('query')({ globalSettings: { serverConfig: serverConfigSelector } }),
        apiCall('query')({ activeAdministrator: activeAdministratorSelector }),
        getAllPaginatedCountries(),
        getAllPaymentMethods(),
        apiCall('query')({ fulfillmentHandlers: configurableOperationDefinitionSelector }),
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
    };
    init();
  }, []);

  return (
    <Layout>
      <Menu>
        <Content className="flex h-full flex-1 flex-col gap-y-4 space-y-4 p-4 pt-6 md:p-8">
          <Outlet />
        </Content>
      </Menu>
    </Layout>
  );
};

const Content = styled.div`
  height: 100%;
  width: 100%;
  overflow-y: auto;
`;
const Main = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  a {
    display: contents;
    text-decoration: none;
  }
`;
