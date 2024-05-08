import { apiCall } from '@/graphql/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from '@/components';
import { useParams } from 'react-router-dom';
import { DraftOrderType, draftOrderSelector } from '@/graphql/draft_order';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  OrderSummary,
  RealizationCard,
  CustomerSelectCard,
  AddressCard,
  ShippingMethod,
  TaxSummary,
  OrderHistory,
  ProductsCard,
  OrderHistoryRefType,
  TopActions,
} from '@/pages/orders/_components';

export type Mode = 'view' | 'create' | 'update';

export const OrderPage = () => {
  const { id } = useParams();

  const { t } = useTranslation('orders');

  const [order, setOrder] = useState<DraftOrderType | undefined>();
  const [loading, setLoading] = useState(true);

  const historyRef = useRef<OrderHistoryRefType>(null);

  useEffect(() => {
    const fetch = async () => {
      if (id) {
        setLoading(true);
        const { order } = await apiCall('query')({ order: [{ id }, draftOrderSelector] });
        if (!order) toast.error(t('toasts.orderLoadingError', { value: id }));
        setOrder(order);
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const mode: Mode | undefined = useMemo(
    () =>
      !order
        ? undefined
        : order?.state === 'Draft' ||
            order?.state === 'AddingItems' ||
            order?.state === 'ArrangingPayment' ||
            order?.state === 'Modifying'
          ? 'create'
          : order?.state === 'PaymentSettled' ||
              order?.state === 'PaymentAuthorized' ||
              order?.state === 'PartiallyShipped'
            ? 'update'
            : 'view',
    [order],
  );

  if (loading) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!order || !mode) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center">
        {t('toasts.orderLoadingError', { value: id })}
      </div>
    );
  }

  return (
    <main>
      <div className="mx-auto flex  w-full max-w-[1440px] flex-col gap-4 2xl:px-8">
        <TopActions order={order} setOrder={setOrder} refetchHistory={() => historyRef.current?.refetchHistory()} />
        <OrderSummary order={order} />
        <RealizationCard
          order={order}
          setOrder={setOrder}
          refetchHistory={() => historyRef.current?.refetchHistory()}
        />
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CustomerSelectCard mode={mode} order={order} setOrder={setOrder} />
          <AddressCard mode={mode} type="billing" order={order} setOrder={setOrder} />
          <AddressCard mode={mode} type="shipping" order={order} setOrder={setOrder} />
          <ShippingMethod mode={mode} order={order} setOrder={setOrder} />
        </div>
        <ProductsCard mode={mode} order={order} setOrder={setOrder} />
        <TaxSummary order={order} />
        <OrderHistory ref={historyRef} orderId={order.id} />
      </div>
    </main>
  );
};
