import { adminApiQuery } from '@/common/client';
import { ProductTileSelector } from '@/graphql/base';
import { useList } from '@/hooks/useList';
import { ResolverInputTypes } from '@/zeus';
import { Stack } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';

const getProducts = async (paginate?: ResolverInputTypes['ProductListOptions']) => {
  const response = await adminApiQuery()({
    products: [{ options: paginate }, { items: ProductTileSelector }],
  });
  return response.products.items;
};

export const ProductListPage = () => {
  const products = useList(getProducts);
  return (
    <Stack direction="column">
      {products?.map((p) => {
        return <TableRow key={p.id}>{p.name}</TableRow>;
      })}
    </Stack>
  );
};

const TableRow = styled(Stack)`
  padding: 0.5rem 1rem;
  border-bottom: 1px solid ${(p) => p.theme.neutrals.L8};
`;
