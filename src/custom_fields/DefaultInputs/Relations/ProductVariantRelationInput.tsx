import { useEffect, useState } from 'react';
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
import { apiCall } from '@/graphql/client';
import { ResolverInputTypes } from '@/zeus';
import { useList } from '@/lists/useList';
import { cn } from '@/lib/utils';
import { useCustomFields } from '@/custom_fields';

const getProductsVariants = async (options: ResolverInputTypes['ProductVariantListOptions']) => {
  const response = await apiCall('query')({
    productVariants: [{ options }, { totalItems: true, items: { id: true } }],
  });
  return response.productVariants;
};

export function ProductVariantRelationInput() {
  const { value, setValue } = useCustomFields();
  const [selectedVariant, setSelectedVariant] = useState<{ id: string } | null>(null);
  const { objects: variants, Paginate } = useList({
    route: async ({ page, perPage }) => {
      const variants = await getProductsVariants({ skip: (page - 1) * perPage, take: perPage });
      return { items: variants.items, totalItems: variants.totalItems };
    },
    listType: 'modal-product-variants-list',
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
                  setValue('');
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
                  'w-1/4 cursor-pointer border-2 p-2',
                  selectedVariant?.id === variant.id && 'border-blue-500',
                )}
                onClick={() => {
                  setSelectedVariant(variant);
                  setValue(variant.id);
                }}
              >
                <span>{variant.id}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <div className="flex w-full flex-col gap-2">
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
