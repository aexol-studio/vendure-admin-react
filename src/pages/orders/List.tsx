import { adminApiQuery } from '@/common/client';
import { Stack } from '@/components/ui/Stack';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderListSelector } from '@/graphql/orders';
import { useList } from '@/lists/useList';
import { ResolverInputTypes, SortOrder } from '@/zeus';
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
  const { t } = useTranslation('orders');

  const {
    objects: orders,
    Paginate,
    sort,
  } = useList({
    route: async ({ page, perPage, sort }) =>
      getOrders({
        take: perPage,
        skip: (page - 1) * perPage,
        ...(!!sort && { sort: { [sort.key]: sort.sortDir } }),
      }),
    cacheKey: 'orders',
  });

  return (
    <Stack column className="gap-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('name')}</TableHead>
            <TableHead>{t('name')}</TableHead>
            <TableHead>{t('slug')}</TableHead>
            <TableHead>{t('variants')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders?.map((p) => {
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <Link to={`/orders/${p.id}/`}>
                    <p>{p.id}</p>
                  </Link>
                </TableCell>
                <TableCell>{p.customer?.emailAddress || p.shippingAddress?.fullName}</TableCell>
                <TableCell>{p.totalWithTax}</TableCell>
                <TableCell>{p.state}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {Paginate}
    </Stack>
  );
};
