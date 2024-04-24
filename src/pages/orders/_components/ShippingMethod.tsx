import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';
import { Price } from '@/components/Price';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DraftOrderType, EligibleShippingMethodsType } from '@/graphql/draft_order';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ShippingMethod: React.FC<{
  order?: DraftOrderType;
  shippingLines?: { id: string; price: number; priceWithTax: number; shippingMethod: { id: string } }[];
  onSelectShippingMethod: (orderId: string, shippingMethodId: string) => Promise<void>;
  shippingMethods: EligibleShippingMethodsType[];
}> = ({ order, shippingMethods, shippingLines, onSelectShippingMethod }) => {
  const { t } = useTranslation('orders');
  const [open, setOpen] = useState(false);
  const [localSelectedShippingMethod, setLocalSelectedShippingMethod] = useState<string | undefined>(undefined);
  const data = shippingMethods.find((method) => method.id === shippingLines?.[0]?.shippingMethod.id);

  return (
    <Card
      className={cn(
        order?.state !== 'Draft' ? 'border-primary' : shippingLines?.length ? 'border-green-500' : 'border-orange-800',
      )}
    >
      <CardHeader>
        <CardTitle>{t('selectShipmentMethod.cardTitle')}</CardTitle>
        <CardDescription>{t('selectShipmentMethod.cardDescription')}</CardDescription>
        <div>
          {data ? (
            <div className="flex flex-col">
              <h3>{data.name}</h3>
              <p>{data.code}</p>
              <p>
                <Price price={order?.shipping || 0} />
              </p>
            </div>
          ) : (
            <p>{t('selectShipmentMethod.noSelected')}</p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen} defaultOpen={false}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {t('selectShipmentMethod.buttonLabel')}
            </Button>
          </DialogTrigger>
          <DialogContent className="h-[50vh] max-w-[60vw]">
            <div className="flex flex-col gap-8">
              <DialogHeader>
                <DialogTitle>{t('selectShipmentMethod.setMethodTitle')}</DialogTitle>
                <DialogDescription>{t('selectShipmentMethod.setMethodDescription')}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap">
                {shippingMethods.map((shippingMethod) => (
                  <div key={shippingMethod.id} className="w-1/4 p-1">
                    <button
                      onClick={() => {
                        const method = shippingMethods.find((method) => method.id === shippingMethod.id);
                        if (method) {
                          setLocalSelectedShippingMethod(method.id);
                        }
                      }}
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
            <div className="flex w-full justify-between gap-2">
              <DialogClose asChild>
                <Button type="button" className="w-full" variant="secondary">
                  {t('selectShipmentMethod.close')}
                </Button>
              </DialogClose>
              <Button
                disabled={!localSelectedShippingMethod || !order?.id}
                className="w-full"
                variant="outline"
                onClick={async () => {
                  const method = shippingMethods.find((method) => method.id === localSelectedShippingMethod);
                  if (method && order?.id) {
                    await onSelectShippingMethod(order.id, method.id).then(() => setOpen(false));
                  }
                }}
              >
                {t('selectShipmentMethod.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
