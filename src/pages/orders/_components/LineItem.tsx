import { TableRow, TableCell, Button } from '@/components';
import { DraftOrderType } from '@/graphql/draft_order';
import React, { PropsWithChildren } from 'react';

type VariantWithQuantity = DraftOrderType['lines'][number]['productVariant'] & { quantity?: number };
export const LineItem: React.FC<
  PropsWithChildren<{
    noBorder?: boolean;
    noHover?: boolean;
    variant: VariantWithQuantity;
    adjustLineItem?: (quantity: number) => void;
  }>
> = ({ noBorder, noHover, children, variant, adjustLineItem }) => {
  return (
    <TableRow noHover={noHover} noBorder={noBorder}>
      <TableCell>
        <div className="flex items-center gap-2">
          <img
            alt="Product image"
            className="aspect-square w-10 rounded-md object-cover"
            height="40"
            width="40"
            src={variant?.featuredAsset?.preview || variant?.product?.featuredAsset?.preview}
          />
          <span className="font-semibold">{variant?.product.name}</span>
        </div>
      </TableCell>
      <TableCell>{variant?.sku}</TableCell>
      {variant?.quantity ? (
        <TableCell>
          {adjustLineItem ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => adjustLineItem(variant.quantity ? variant.quantity + 1 : 1)}
              >
                +
              </Button>
              <span>{variant?.quantity}</span>
              <Button
                variant="ghost"
                type="button"
                onClick={() => adjustLineItem(variant.quantity ? variant.quantity - 1 : 1)}
              >
                -
              </Button>
            </div>
          ) : (
            variant?.quantity
          )}
        </TableCell>
      ) : null}
      {children}
    </TableRow>
  );
};
