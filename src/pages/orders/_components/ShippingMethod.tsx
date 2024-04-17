import { Button } from '@/components';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EligibleShippingMethodsType } from '@/graphql/draft_order';
import React from 'react';

export const ShippingMethod: React.FC<{
  selectedShippingMethod: string;
  onChange: (value: string) => void;
  shippingMethods: EligibleShippingMethodsType[];
}> = ({ shippingMethods, selectedShippingMethod, onChange }) => {
  return (
    <Dialog>
      <Button variant="outline" size="sm">
        <DialogTrigger>Set shipping method</DialogTrigger>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set shipping method</DialogTitle>
          <DialogDescription>Select a shipping method</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          {shippingMethods.map((shippingMethod) => (
            <div key={shippingMethod.id} className="flex items-center gap-2">
              <input
                type="radio"
                id={shippingMethod.id}
                name="shippingMethod"
                value={shippingMethod.id}
                checked={selectedShippingMethod === shippingMethod.id}
                onChange={() => onChange(shippingMethod.id)}
              />
              <label htmlFor={shippingMethod.id}>
                <div>
                  <div>{shippingMethod.name}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
        <div className="flex w-full gap-2 justify-between">
          <DialogClose asChild>
            <Button type="button" className="w-full" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <Button type="submit" className="w-full" variant="outline">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
