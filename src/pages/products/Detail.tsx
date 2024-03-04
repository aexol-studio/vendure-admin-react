import { adminApiQuery } from '@/common/client';
import { ProductDetailSelector } from '@/graphql/base';
import { useDetail } from '@/lists/useDetail';
import { Stack, TextField } from '@aexol-studio/styling-system';

const getProduct = async ({ slug }: { slug: string }) => {
  const response = await adminApiQuery()({
    product: [{ slug }, ProductDetailSelector],
  });
  return response.product;
};

export const ProductDetailPage = () => {
  const { object } = useDetail({
    cacheKey: 'productDetail',
    route: getProduct,
  });

  return (
    <Stack direction="column">
      <TextField value={object?.name} />
    </Stack>
  );
};
