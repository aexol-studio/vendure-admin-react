import { Button } from '@/components';
import React, { PropsWithChildren } from 'react';

export const DefaultListLineWrapper: React.FC<PropsWithChildren<{ removeEntry: () => void }>> = ({
  children,
  removeEntry,
}) => {
  return (
    <div>
      {children}
      <Button onClick={removeEntry} variant="destructive" size="sm">
        Remove
      </Button>
    </div>
  );
};
