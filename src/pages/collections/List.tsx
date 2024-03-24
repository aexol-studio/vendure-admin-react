import { adminApiQuery } from '@/common/client';
import { Table, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CollectionSelector } from '@/graphql/base';
import { useList } from '@/lists/useList';
import { ResolverInputTypes } from '@/zeus';
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
    <Table>
      <TableCaption>Collections</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>
            <div />
          </TableHead>
          <TableHead>{t('name')}</TableHead>
          <TableHead>{t('slug')}</TableHead>
        </TableRow>
      </TableHeader>
      {collections?.map((p) => {
        return (
          <TableRow key={p.slug}>
            <TableCell>
              <img src={p.featuredAsset?.preview + '?preset=tiny'} />
            </TableCell>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.slug}</TableCell>
          </TableRow>
        );
      })}
      {Paginate}
    </Table>
  );
};
