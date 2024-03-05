import { adminApiQuery } from '@/common/client';
import { TH, TableRow } from '@/common/components/table/table';
import { OrderListSelector } from '@/graphql/orders';
import { useList } from '@/lists/useList';
import { ResolverInputTypes } from '@/zeus';
import { Stack, Typography } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const getOrders = async (paginate: ResolverInputTypes['OrderListOptions']) => {
  const response = await adminApiQuery()({
    orders: [
      { options: paginate },
      {
        totalItems: true,
        items: OrderListSelector,
      },
    ],
  });
  return response.orders;
};

export const OrderListPage = () => {
  const { objects: orders, Paginate } = useList({
    route: async (p) => {
      return getOrders({ take: 10, skip: p.page });
    },
    limit: 10,
    cacheKey: 'orders',
  });
  const { t } = useTranslation('orders');
  return (
    <Stack direction="column">
      <OrderRow>
        <TH>{t('name')}</TH>
        <TH>{t('slug')}</TH>
        <TH>{t('variants')}</TH>
      </OrderRow>
      {orders?.map((p) => {
        return (
          <OrderRow gap="1rem" key={p.id}>
            <Link to={`/orders/${p.id}/`}>
              <Typography>{p.id}</Typography>
            </Link>
            <Typography>{p.customer?.emailAddress || p.shippingAddress?.fullName}</Typography>
            <Typography>{p.totalWithTax}</Typography>
            <Typography>{p.state}</Typography>
          </OrderRow>
        );
      })}
      {Paginate}
    </Stack>
  );
};
const OrderRow = styled(TableRow)`
  display: grid;
  grid-template-columns: 2rem 3fr 3fr 1fr;
`;
