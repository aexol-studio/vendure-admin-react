import { cn } from '@/lib/utils';
import React from 'react';

export const Stack = ({
  children,
  column,
  className,
}: {
  children?: React.ReactNode;
  column?: boolean;
  className?: string;
}) => {
  return <div className={cn('flex', column && 'flex-col', className)}>{children}</div>;
};
