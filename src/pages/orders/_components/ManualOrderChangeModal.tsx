import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DraftOrderType } from '@/graphql/draft_order';

export const ManualOrderChangeModal: React.FC<{
  open: boolean;
  setOpen: (value: boolean) => void;
  order?: DraftOrderType;
  currentPossibilities?: { name: string; to: string[] };
}> = ({ currentPossibilities, order, open, setOpen }) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[40vw]">
        <DialogHeader>
          <DialogTitle>
            Zmiana statusu zamówienia
            <span className="text-xs text-neutral-500"> - {order?.state}</span>
          </DialogTitle>
          <DialogDescription>Wybierz nowy status zamówienia, który chcesz ustawić dla zamówienia.</DialogDescription>
          <Select name="orderState" defaultValue={currentPossibilities?.to.find((state) => state !== order?.state)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentPossibilities?.to.map((state) => (
                <SelectItem key={state} value={state} onSelect={() => {}}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
