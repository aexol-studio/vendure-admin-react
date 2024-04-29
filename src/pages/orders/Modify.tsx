import { adminApiQuery } from '@/common/client';
import { Stack } from '@/components/Stack';
import { Button } from '@/components/ui/button';
import { OrderSelector } from '@/graphql/orders';
import { resetCache } from '@/lists/cache';
import { useDetail } from '@/lists/useDetail';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const getOrder = async ({ slug }: { slug: string }) => {
  const response = await adminApiQuery({
    order: [{ id: slug }, OrderSelector],
  });
  return response.order;
};
// const updateOrder = async (props: ModelTypes['ModifyOrderInput']) => {
//   const response = await adminApiMutation({
//     // modifyOrder: [{ input: props }, { id: true }],
//   });
//   return response.modifyOrder.id;
// };

export const OrderDetailPage = () => {
  const { t } = useTranslation('orders');

  const { object, reset } = useDetail({
    cacheKey: 'orderDetail',
    route: getOrder,
  });

  // const { state, setField } = useGFFLP('ModifyOrderInput', 'options')({});
  useEffect(() => {}, [object]);

  return (
    <Stack>
      <Button
        onClick={() => {
          if (!object) return;
          // updateOrder({ id: object.id });
          reset();
          resetCache('orders');
          return;
        }}
      >
        {t('forms.update')}
      </Button>
    </Stack>
  );
};
