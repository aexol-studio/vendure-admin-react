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

const getProducts = async (options: ResolverInputTypes['ProductListOptions']) => {
  const response = await adminApiQuery()({
    products: [{ options }, { totalItems: true, items: { id: true, featuredAsset: { preview: true } } }],
  });
  return response.products;
};

export function ProductRelationInput<T>(props: DefaultProps<T>) {
  const { value, onChange } = props;
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    featuredAsset?: { preview: string };
  } | null>(null);
  const { objects: products, Paginate } = useList({
    route: async ({ page, perPage }) => {
      const products = await getProducts({ skip: (page - 1) * perPage, take: perPage });
      return { items: products.items, totalItems: products.totalItems };
    },
    cacheKey: `modal-products-list`,
  });

  useEffect(() => {
    if (value) {
      getProducts({ take: 1, filter: { id: { eq: value as string } } }).then((products) => {
        setSelectedProduct(products.items[0] || null);
      });
    }
  }, [value]);

  return (
    <Dialog>
      <div>
        <Button variant="secondary" size="sm">
          <DialogTrigger>Pick product</DialogTrigger>
        </Button>
        <div>
          {selectedProduct && (
            <div>
              <span>{selectedProduct.id}</span>
              {selectedProduct.featuredAsset && (
                <img
                  src={selectedProduct.featuredAsset.preview}
                  alt={selectedProduct.id}
                  className="object-fill w-32 h-32"
                />
              )}
            </div>
          )}
        </div>
      </div>
      <DialogContent className="max-w-[800px] ">
        <DialogHeader>
          <DialogTitle>Product</DialogTitle>
          <DialogDescription>Select a product to this relation</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[700px] p-2">
          <div className="flex flex-wrap">
            {products?.map((product) => (
              <div
                key={product.id}
                className={cn(
                  'w-1/4 p-2 border-2 cursor-pointer',
                  selectedProduct?.id === product.id && 'border-blue-500',
                )}
                onClick={() => {
                  setSelectedProduct(product);
                  onChange(product.id as T);
                }}
              >
                <span>{product.id}</span>
                {product.featuredAsset && (
                  <img src={product.featuredAsset.preview} alt={product.id} className="object-fill w-32 h-32" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <div className="flex flex-col w-full gap-2">
            {Paginate}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="lg">
                <DialogClose>{selectedProduct ? 'Save' : 'Cancel'}</DialogClose>
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}