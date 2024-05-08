import { apiCall } from '@/graphql/client';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DraftOrderType,
  EligibleShippingMethodsType,
  draftOrderSelector,
  eligibleShippingMethodsSelector,
} from '@/graphql/draft_order';
import { cn } from '@/lib/utils';
import { Mode } from '@/pages/orders/OrderPage';
import { priceFormatter } from '@/utils';
import { Edit } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const ShippingMethod: React.FC<{
  mode: Mode;
  order: DraftOrderType;
  setOrder: React.Dispatch<React.SetStateAction<DraftOrderType | undefined>>;
}> = ({ order, setOrder, mode }) => {
  const { t } = useTranslation('orders');
  const [open, setOpen] = useState(false);
  const [localSelectedShippingMethod, setLocalSelectedShippingMethod] = useState<string | undefined>(undefined);

  const [shippingMethods, setShippingMethods] = useState<EligibleShippingMethodsType[]>([]);
  const selectedShipping = useMemo(
    () => shippingMethods.find((method) => method.id === order?.shippingLines?.[0]?.shippingMethod.id),
    [shippingMethods, order],
  );

  useEffect(() => {
    const fetch = async () => {
      if (order && order.id) {
        const { eligibleShippingMethodsForDraftOrder } = await apiCall('query')({
          eligibleShippingMethodsForDraftOrder: [{ orderId: order.id }, eligibleShippingMethodsSelector],
        });
        if (!eligibleShippingMethodsForDraftOrder) {
          toast.error(t('toasts.orderLoadingDraftShippingError', { value: order.id }));
        }
        setShippingMethods(eligibleShippingMethodsForDraftOrder);
      }
    };
    fetch();
  }, [order]);

  const selectShippingMethod = async (orderId: string, shippingMethodId: string) => {
    const { setDraftOrderShippingMethod } = await apiCall('mutation')({
      setDraftOrderShippingMethod: [
        { orderId, shippingMethodId },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on IneligibleShippingMethodError': { message: true, errorCode: true },
          '...on NoActiveOrderError': { message: true, errorCode: true },
          '...on OrderModificationError': { message: true, errorCode: true },
        },
      ],
    });
    if (setDraftOrderShippingMethod.__typename === 'Order') {
      setOrder(setDraftOrderShippingMethod);
      toast.success(t('selectShipmentMethod.shippingAdded'));
      setOpen(false);
    } else toast.error(`${setDraftOrderShippingMethod.errorCode}: ${setDraftOrderShippingMethod.message}`);
  };

  return (
    <Card
      className={cn(
        mode !== 'create' ? 'border-primary' : order?.shippingLines?.length ? 'border-green-500' : 'border-orange-800',
      )}
    >
      <CardHeader>
        <CardTitle className="flex flex-row justify-between text-base">
          {t('selectShipmentMethod.cardTitle')}
          {mode !== 'view' && (
            <Dialog open={open} onOpenChange={setOpen} defaultOpen={false}>
              <DialogTrigger disabled={!order?.lines.length}>
                <Edit
                  size={20}
                  className={cn(
                    'cursor-pointer  self-center',
                    !order?.lines.length && 'cursor-not-allowed text-muted-foreground',
                  )}
                />
              </DialogTrigger>
              <DialogContent className="max-w-[60vw]">
                <div className="flex flex-col gap-8">
                  <DialogHeader>
                    <DialogTitle>{t('selectShipmentMethod.setMethodTitle')}</DialogTitle>
                    <DialogDescription>{t('selectShipmentMethod.setMethodDescription')}</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-wrap">
                    {shippingMethods.map((shippingMethod) => (
                      <div key={shippingMethod.id} className="w-1/4 p-1">
                        <button
                          onClick={() => setLocalSelectedShippingMethod(shippingMethod.id)}
                          className={cn(
                            'relative flex w-full gap-2 rounded-md border p-4',
                            localSelectedShippingMethod === shippingMethod.id
                              ? 'border-primary'
                              : 'border-primary-foreground',
                          )}
                        >
                          <div className="flex flex-col items-start">
                            <h3 className="text-lg">{shippingMethod.name}</h3>
                            <p className="text-sm">{shippingMethod.code}</p>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  disabled={!localSelectedShippingMethod || !order?.id}
                  className="w-min place-self-end "
                  onClick={async () => {
                    const method = shippingMethods.find((method) => method.id === localSelectedShippingMethod);
                    if (method && order?.id) await selectShippingMethod(order.id, method.id);
                  }}
                >
                  {t('selectShipmentMethod.save')}
                </Button>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>

        <CardDescription>{t('selectShipmentMethod.cardDescription')}</CardDescription>
        {!order?.lines.length ? (
          <Label className="text-sm text-muted-foreground">
            <p>{t('selectShipmentMethod.noSelectedTip')}</p>
          </Label>
        ) : (
          <div className="flex flex-col">
            {selectedShipping ? (
              <>
                <Label className="text-sm text-muted-foreground">{selectedShipping.name}</Label>
                <Label className="text-sm text-muted-foreground">{selectedShipping.code}</Label>
                <Label className="text-sm text-muted-foreground">{priceFormatter(order?.shipping || 0)}</Label>
              </>
            ) : (
              <Label className="text-sm text-muted-foreground">{t('selectShipmentMethod.noSelected')}</Label>
            )}
          </div>
        )}
      </CardHeader>
    </Card>
  );
};
