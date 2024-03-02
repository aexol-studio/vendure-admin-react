import { adminApiQuery } from '@/common/client';
import { TH, TableAvatar, TableRow } from '@/common/components/table/table';
import { ProductTileSelector } from '@/graphql/base';
import { useList } from '@/hooks/useList';
import { ResolverInputTypes } from '@/zeus';
import { Stack, Typography } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

const getProducts = (paginate?: ResolverInputTypes['ProductListOptions']) => async () => {
  const response = await adminApiQuery()({
    products: [{ options: paginate }, { items: ProductTileSelector }],
  });
  return response.products.items;
};

export const ProductListPage = () => {
  const products = useList(getProducts({ take: 20 }));
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
            <Typography>{p.name}</Typography>
            <Typography>{p.slug}</Typography>
            <Typography>{p.variantList.totalItems}</Typography>
          </ProductRow>
        );
      })}
    </Stack>
  );
};
const ProductRow = styled(TableRow)`
  display: grid;
  grid-template-columns: 2rem 3fr 3fr 1fr;
`;
