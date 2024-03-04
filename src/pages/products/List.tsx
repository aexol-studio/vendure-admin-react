import { adminApiQuery } from '@/common/client';
import { TH, TableAvatar, TableRow } from '@/common/components/table/table';
import { ProductTileSelector } from '@/graphql/base';
import { useList } from '@/lists/useList';
import { ResolverInputTypes } from '@/zeus';
import { Stack, Typography } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const getProducts = async (paginate: ResolverInputTypes['ProductListOptions']) => {
  const response = await adminApiQuery()({
    products: [{ options: paginate }, { items: ProductTileSelector, totalItems: true }],
  });
  return response.products;
};

export const ProductListPage = () => {
  const { objects: products, Paginate } = useList({
    route: async (p) => {
      return getProducts({ take: 10, skip: p.page });
    },
    limit: 10,
    cacheKey: 'products',
  });
  const { t } = useTranslation('products');
  return (
    <Stack direction="column">
      <ProductRow>
        <div />
        <TH>{t('name')}</TH>
        <TH>{t('slug')}</TH>
        <TH>{t('variants')}</TH>
      </ProductRow>
      {products?.map((p) => {
        return (
          <ProductRow gap="1rem" key={p.id}>
            <TableAvatar src={p.featuredAsset?.preview + '?preset=tiny'} />
            <Link to={`/products/${p.slug}/`}>
              <Typography>{p.name}</Typography>
            </Link>
            <Typography>{p.slug}</Typography>
            <Typography>{p.variantList.totalItems}</Typography>
          </ProductRow>
        );
      })}
      {Paginate}
    </Stack>
  );
};
const ProductRow = styled(TableRow)`
  display: grid;
  grid-template-columns: 2rem 3fr 3fr 1fr;
`;
