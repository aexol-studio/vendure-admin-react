import { adminApiQuery } from '@/common/client';
import { ProductTileSelector } from '@/graphql/products';
import { useList } from '@/lists/useList';
import { ResolverInputTypes, SortOrder } from '@/zeus';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      return getProducts({ take: 10, skip: p.page, sort });
    },
    limit: 10,
    cacheKey: 'products',
  });
  const { t } = useTranslation('products');

  return (
    <Table>
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
            <TableRow key={p.id}>
              <TableCell>
                <img src={p.featuredAsset?.preview + '?preset=tiny'} />
              </TableCell>
              <TableCell>
                <Link to={`/products/${p.slug}/`}>
                  <p>{p.name}</p>
                </Link>
              </TableCell>
              <TableCell>
                <p>{p.slug}</p>
              </TableCell>
              <TableCell>
                <p>{p.variantList.totalItems}</p>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      {Paginate}
    </Table>
  );
};
