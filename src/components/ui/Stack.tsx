import React from 'react';

export const Stack = ({
  children,
}: {
  children?: React.ReactNode;
  gap?: string;
  justify?: 'end' | 'between' | 'start';
  column?: boolean;
}) => {
  return <div className="flex">{children}</div>;
};
