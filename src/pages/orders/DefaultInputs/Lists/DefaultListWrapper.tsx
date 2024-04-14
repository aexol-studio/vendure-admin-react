import { Button, ScrollArea } from '@/components';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CustomFieldConfigType } from '@/graphql/base';
import React, { PropsWithChildren } from 'react';

export const DefaultListWrapper: React.FC<
  PropsWithChildren<{
    field: CustomFieldConfigType;
    addNewEntry: () => void;
  }>
> = ({ field, children, addNewEntry }) => {
  return (
    <Dialog>
      <div className="flex justify-between items-center p-4">
        <span>{field.name}</span>
        <Button variant="secondary" size="sm">
          <DialogTrigger>Open</DialogTrigger>
        </Button>
      </div>
      <DialogContent>
        <div className="p-4 flex flex-col gap-2">
          <ScrollArea className="h-96 p-4">{children}</ScrollArea>
          <Button onClick={addNewEntry} variant="secondary" size="sm">
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
