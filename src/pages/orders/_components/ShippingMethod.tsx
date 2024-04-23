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

export const ShippingMethod: React.FC<{
  order?: DraftOrderType;
  shippingLines?: { id: string; price: number; priceWithTax: number; shippingMethod: { id: string } }[];
  onSelectShippingMethod: (value: string) => Promise<void>;
  shippingMethods: EligibleShippingMethodsType[];
}> = ({ order, shippingMethods, shippingLines, onSelectShippingMethod }) => {
  const [localSelectedShippingMethod, setLocalSelectedShippingMethod] = useState<string | undefined>(undefined);
  const data = shippingMethods.find((method) => method.id === shippingLines?.[0]?.shippingMethod.id);

  return (
    <Card
      className={cn(
        order?.state !== 'Draft' ? 'border-primary' : shippingLines?.length ? 'border-green-500' : 'border-orange-800',
      )}
    >
      <CardHeader>
        <CardTitle>Select shipping method</CardTitle>
        <CardDescription>Select a shipping method</CardDescription>
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
            <p>No shipping method selected</p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Set shipping method
            </Button>
          </DialogTrigger>
          <DialogContent className="h-[50vh] max-w-[60vw]">
            <form
              className="flex h-full flex-col justify-between"
              onSubmit={async (e) => {
                e.preventDefault();
                const method = shippingMethods.find((method) => method.id === localSelectedShippingMethod);
                if (method) {
                  await onSelectShippingMethod(method.id);
                }
              }}
            >
              <div className="flex flex-col gap-8">
                <DialogHeader>
                  <DialogTitle>Set shipping method</DialogTitle>
                  <DialogDescription>Select a shipping method</DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap">
                  {shippingMethods.map((shippingMethod) => {
                    return (
                      <div key={shippingMethod.id} className="w-1/4 p-1">
                        <button
                          onClick={() => {
                            const method = shippingMethods.find((method) => method.id === shippingMethod.id);
                            if (method) {
                              setLocalSelectedShippingMethod(method.id);
                            }
                          }}
                          className={cn(
                            'relative flex w-full gap-2 border p-4',
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
                    );
                  })}
                </div>
              </div>
              <div className="flex w-full justify-between gap-2">
                <DialogClose asChild>
                  <Button type="button" className="w-full" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-full" variant="outline">
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
