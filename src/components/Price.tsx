import { priceFormatter } from '@/utils/priceFormatter';
import { CurrencyCode } from '@/zeus';
import React from 'react';

export const Price: React.FC<{
  price: number;
  code?: CurrencyCode;
}> = ({ price, code }) => {
  return <>{priceFormatter(price, code)}</>;
};
