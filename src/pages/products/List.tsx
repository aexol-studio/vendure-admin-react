import { adminApiQuery } from '@/common/client';
import { ProductTileSelector } from '@/graphql/products';
import { useList } from '@/lists/useList';
import { ResolverInputTypes, SortOrder } from '@/zeus';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const getProducts = async (paginate: ResolverInputTypes['ProductListOptions']) => {
  const response = await adminApiQuery()({
    products: [{ options: paginate }, { items: ProductTileSelector, totalItems: true }],
  });
  return response.products;
};

export const ProductListPage = () => {
  const {
    objects: products,
    Paginate,
    sort,
  } = useList({
    route: async (p) => {
      const sort = p.sort
        ? {
            [p.sort]: SortOrder.DESC,
          }
        : undefined;
      return getProducts({ take: 10, skip: (p.page - 1) * 10, sort });
    },
    limit: 10,
    cacheKey: 'products',
  });
  const { t } = useTranslation('products');

  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <div />
          <TableHead onClick={() => sort('name')}>{t('name')}</TableHead>
          <TableHead>{t('slug')}</TableHead>
          <TableHead>{t('variants')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products?.map((p) => {
          return (
            <TableRow key={p.slug}>
              <TableCell>
                <img src={p.featuredAsset?.preview + '?preset=tiny'} />
              </TableCell>
              <TableCell>
                <Link to={`/products/${p.slug}/`}>{p.name}</Link>
              </TableCell>
              <TableCell>{p.slug}</TableCell>
              <TableCell>{p.variantList.totalItems}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>{Paginate}</TableFooter>
    </Table>
  );
};
