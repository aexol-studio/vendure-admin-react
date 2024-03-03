import { adminApiQuery } from '@/common/client';
import { TH, TableAvatar, TableRow } from '@/common/components/table/table';
import { CollectionSelector } from '@/graphql/base';
import { useList } from '@/lists/useList';
import { ResolverInputTypes } from '@/zeus';
import { Stack, Typography } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

const getCollections = async (paginate?: ResolverInputTypes['ProductListOptions']) => {
  const response = await adminApiQuery()({
    collections: [
      {
        options: {
          ...paginate,
          topLevelOnly: true,
        },
      },
      { items: CollectionSelector, totalItems: true },
    ],
  });
  return response.collections;
};

export const CollectionsListPage = () => {
  const { objects: collections, Paginate } = useList({
    route: async (p) => {
      return getCollections({ take: 10, skip: p.page });
    },
    limit: 10,
    cacheKey: 'collections',
  });
  const { t } = useTranslation('products');
  return (
    <Stack direction="column">
      <CollectionRow>
        <div />
        <TH>{t('name')}</TH>
        <TH>{t('slug')}</TH>
      </CollectionRow>
      {collections?.map((p) => {
        return (
          <CollectionRow gap="1rem" key={p.slug}>
            <TableAvatar src={p.featuredAsset?.preview + '?preset=tiny'} />
            <Typography>{p.name}</Typography>
            <Typography>{p.slug}</Typography>
          </CollectionRow>
        );
      })}
      {Paginate}
    </Stack>
  );
};
const CollectionRow = styled(TableRow)`
  display: grid;
  grid-template-columns: 2rem 3fr 3fr;
`;
