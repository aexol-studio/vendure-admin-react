import React, { useEffect, useState } from 'react';
import { DefaultProps } from '../types';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button, ScrollArea } from '@/components';
import { adminApiQuery } from '@/common/client';
import { ResolverInputTypes } from '@/zeus';
import { useList } from '@/lists/useList';
import { cn } from '@/lib/utils';

const getProductsVariants = async (options: ResolverInputTypes['ProductVariantListOptions']) => {
  const response = await adminApiQuery()({
    productVariants: [{ options }, { totalItems: true, items: { id: true } }],
  });
  return response.productVariants;
};

export function ProductVariantRelationInput<T>(props: DefaultProps<T>) {
  const { value, onChange } = props;
  const [selectedVariant, setSelectedVariant] = useState<{ id: string } | null>(null);
  const { objects: variants, Paginate } = useList({
    route: async ({ page, perPage }) => {
      const variants = await getProductsVariants({ skip: (page - 1) * perPage, take: perPage });
      return { items: variants.items, totalItems: variants.totalItems };
    },
    cacheKey: `modal-product-variants-list`,
  });

  useEffect(() => {
    if (value) {
      getProductsVariants({ take: 1, filter: { id: { eq: value as string } } }).then((variants) => {
        setSelectedVariant(variants.items[0] || null);
      });
    }
  }, [value]);

  return (
    <Dialog>
      <div>
        <Button variant="secondary" size="sm">
          <DialogTrigger>Pick variant</DialogTrigger>
        </Button>
        <div>
          {selectedVariant && (
            <div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedVariant(null);
                  onChange('' as T);
                }}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>
      <DialogContent className="max-w-[800px] ">
        <DialogHeader>
          <DialogTitle>Variant</DialogTitle>
          <DialogDescription>Select a variant to this relation</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[700px] p-2">
          <div className="flex flex-wrap">
            {variants?.map((variant) => (
              <div
                key={variant.id}
                className={cn(
                  'w-1/4 p-2 border-2 cursor-pointer',
                  selectedVariant?.id === variant.id && 'border-blue-500',
                )}
                onClick={() => {
                  setSelectedVariant(variant);
                  onChange(variant.id as T);
                }}
              >
                <span>{variant.id}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <div className="flex flex-col w-full gap-2">
            {Paginate}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="lg">
                <DialogClose>{selectedVariant ? 'Save' : 'Cancel'}</DialogClose>
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
