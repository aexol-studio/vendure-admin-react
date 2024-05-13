import { apiCall } from '@/graphql/client';
import {
  AlertDialogHeader,
  AlertDialogFooter,
  Button,
  DropdownMenu,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components';
import { DraftOrderType, addFulfillmentToOrderResultSelector, draftOrderSelector } from '@/graphql/draft_order';
import { AddPaymentDialog } from '@/pages/orders/_components/AddPaymentDialog';
import { FulfillmentModal } from '@/pages/orders/_components/FulfillmentModal';
import { ManualOrderChangeModal } from '@/pages/orders/_components/ManualOrderChangeModal';
import { OrderStateBadge } from '@/pages/orders/_components/OrderStateBadge';
import { PossibleOrderStates } from '@/pages/orders/_components/PossibleOrderStates';
import { useServer } from '@/state';
import { Routes } from '@/utils';
import { DeletionResult, ResolverInputTypes } from '@/zeus';

import { ChevronLeft, EllipsisVerticalIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Renderer } from '@/plugins';

interface Props {
  order: DraftOrderType;
  setOrder: React.Dispatch<React.SetStateAction<DraftOrderType | undefined>>;
  refetchHistory: () => void;
}

export const TopActions: React.FC<Props> = ({ order, setOrder, refetchHistory }) => {
  const { t } = useTranslation('orders');
  const navigate = useNavigate();
  const serverConfig = useServer((p) => p.serverConfig);

  const [manualChange, setManualChange] = useState(false);

  const currentPossibilities = useMemo(() => {
    return serverConfig?.orderProcess?.find((state) => state.name === order?.state);
  }, [serverConfig, order]);

  const isOrderValid = useMemo(() => {
    const isVariantValid = !!order.lines.every((line) => line.productVariant);
    const isCustomerValid = !!order.customer?.id;
    const isBillingAddressValid = !!order.billingAddress?.streetLine1;
    const isShippingAddressValid = !!order.shippingAddress?.streetLine1;
    const isShippingMethodValid = !!order.shippingLines?.length;
    return (
      isVariantValid && isCustomerValid && isBillingAddressValid && isShippingAddressValid && isShippingMethodValid
    );
  }, [order]);

  const onSubmit = async () => {
    if (!isOrderValid) {
      toast.error(t('topActions.fillAll'), { position: 'top-center', closeButton: true });
      return;
    }
    const { transitionOrderToState } = await apiCall('mutation')({
      transitionOrderToState: [
        { id: order.id, state: 'ArrangingPayment' },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on OrderStateTransitionError': {
            errorCode: true,
            message: true,
            fromState: true,
            toState: true,
            transitionError: true,
          },
        },
      ],
    });
    if (transitionOrderToState?.__typename === 'Order') {
      setOrder(transitionOrderToState);
      refetchHistory();
    } else {
      const errorMessage = `
        ${transitionOrderToState?.message || t('topActions.errMsg')}
        ${transitionOrderToState?.transitionError || ''}
      `;
      toast(errorMessage, { position: 'top-center' });
    }
  };

  const addPaymentToOrder = async (input: ResolverInputTypes['ManualPaymentInput']) => {
    const { addManualPaymentToOrder } = await apiCall('mutation')({
      addManualPaymentToOrder: [
        { input },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on ManualPaymentStateError': { message: true, errorCode: true },
        },
      ],
    });
    if (addManualPaymentToOrder.__typename === 'Order') {
      setOrder(addManualPaymentToOrder);
      refetchHistory();
    } else {
      toast.error(`${addManualPaymentToOrder.message}`, { position: 'top-center' });
    }
  };

  const fulfillOrder = async (input: ResolverInputTypes['FulfillOrderInput']) => {
    const { addFulfillmentToOrder } = await apiCall('mutation')({
      addFulfillmentToOrder: [{ input }, addFulfillmentToOrderResultSelector],
    });
    if (addFulfillmentToOrder.__typename === 'Fulfillment') {
      const { transitionFulfillmentToState } = await apiCall('mutation')({
        transitionFulfillmentToState: [
          { id: addFulfillmentToOrder.id, state: 'Shipped' },
          {
            __typename: true,
            '...on Fulfillment': {
              id: true,
            },
            '...on FulfillmentStateTransitionError': {
              errorCode: true,
              fromState: true,
              message: true,
              toState: true,
              transitionError: true,
            },
          },
        ],
      });
      if (transitionFulfillmentToState.__typename === 'Fulfillment') {
        const resp = await apiCall('query')({ order: [{ id: order.id }, draftOrderSelector] });
        setOrder(resp.order);
        refetchHistory();
        toast.success(t('topActions.fulfillmentAdded'), { position: 'top-center' });
        return;
      } else {
        toast.error(`${transitionFulfillmentToState.message}`, { position: 'top-center' });
      }
    } else {
      toast.error(`${addFulfillmentToOrder.message}`, { position: 'top-center' });
    }
  };

  const cancelOrder = async () => {
    if (order) {
      const { cancelOrder } = await apiCall('mutation')({
        cancelOrder: [
          { input: { orderId: order.id } },
          {
            __typename: true,
            '...on Order': draftOrderSelector,
            '...on EmptyOrderLineSelectionError': {
              errorCode: true,
              message: true,
            },
            '...on QuantityTooGreatError': {
              errorCode: true,
              message: true,
            },
            '...on MultipleOrderError': {
              errorCode: true,
              message: true,
            },
            '...on CancelActiveOrderError': {
              errorCode: true,
              message: true,
            },
            '...on OrderStateTransitionError': {
              errorCode: true,
              message: true,
            },
          },
        ],
      });
      if (cancelOrder.__typename === 'Order') {
        setOrder(cancelOrder);
        toast.info(t('topActions.orderCanceledSuccessfully'));
      } else {
        toast.error(t('topActions.orderCancelError', { value: cancelOrder.message }), { position: 'top-center' });
      }
    }
  };

  const deleteDraftOrder = async () => {
    const { deleteDraftOrder } = await apiCall('mutation')({
      deleteDraftOrder: [{ orderId: order.id }, { message: true, result: true }],
    });
    if (deleteDraftOrder.result === DeletionResult.DELETED) {
      toast.info(t('topActions.draftDeletedSuccessfully'));
      navigate(-1);
    } else {
      toast.error(t('topActions.draftDeleteError', { value: deleteDraftOrder.message }), { position: 'top-center' });
    }
  };

  return (
    <div className="flex items-center gap-4 ">
      <ManualOrderChangeModal
        open={manualChange}
        setOpen={setManualChange}
        order={order}
        currentPossibilities={currentPossibilities}
      />
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={() => {
          if (order.state === 'Draft') {
            toast.error(t('create.leaveToastMessage'), {
              position: 'top-center',
              action: { label: t('create.leaveToastButton'), onClick: () => navigate(Routes.orders) },
            });
          } else navigate(Routes.orders);
        }}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">{t('create.back')}</span>
      </Button>
      <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
        {t('create.orderId', { value: order.id })}
      </h1>
      <OrderStateBadge state={order.state} />
      <div className="hidden items-center gap-2 md:ml-auto md:flex">
        {order.state === 'Draft' ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast(t('create.leaveToastMessage'), {
                  position: 'top-center',
                  action: {
                    label: t('create.leaveToastButton'),
                    onClick: () => navigate(Routes.orders),
                  },
                });
              }}
            >
              {t('create.discardButton')}
            </Button>
            <Button size="sm" onClick={onSubmit} disabled={!isOrderValid}>
              {t('create.completeOrderButton')}
            </Button>
          </>
        ) : order?.state === 'PaymentSettled' ? (
          <FulfillmentModal draftOrder={order} onSubmitted={fulfillOrder} />
        ) : order.state !== 'Shipped' &&
          order.state !== 'PartiallyShipped' &&
          order.state !== 'Delivered' &&
          order.state !== 'PartiallyDelivered' &&
          order.state !== 'Cancelled' &&
          order.state !== 'Fulfilled' &&
          order.state !== 'PartiallyFulfilled' ? (
          <>
            <AddPaymentDialog order={order} onSubmit={(v) => addPaymentToOrder(v)} />
            <Button
              size="sm"
              variant="secondary"
              disabled={order.state !== 'PaymentAuthorized'}
              onClick={() => {
                toast(t('create.leaveToastMessage'), {
                  position: 'top-center',
                  action: {
                    label: t('create.leaveToastButton'),
                    onClick: () => navigate(Routes.orders),
                  },
                });
              }}
            >
              {t('create.realizeOrder')}
            </Button>
          </>
        ) : null}
      </div>
      <Renderer position="top-buttons" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <EllipsisVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {order.state === 'PaymentSettled' ? (
            <DropdownMenuItem asChild>
              <Button variant="ghost" className="w-full justify-start">
                {t('create.modifyOrder')}
              </Button>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <PossibleOrderStates orderState={order.state} />
          </DropdownMenuItem>
          {order.state !== 'Cancelled' && order.state !== 'Draft' && (
            <DropdownMenuItem asChild>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    {t('create.cancelOrder')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('create.areYouSure')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('create.cancelOrderMessage')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('create.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => cancelOrder()}>{t('create.continue')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
          )}
          {order.state === 'Draft' && (
            <DropdownMenuItem asChild>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    {t('deleteDraft.button')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteDraft.title')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('deleteDraft.description')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('deleteDraft.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteDraftOrder()}>{t('deleteDraft.confirm')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Button onClick={() => setManualChange(true)} variant="ghost" className="w-full justify-start">
              {t('topActions.manualChangeStatus')}
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
