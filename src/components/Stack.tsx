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
  return <div className={`flex ${column ? ' flex-col' : ''}${className ? ` ${className}` : ''}`}>{children}</div>;
};
