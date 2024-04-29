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
import { adminApiQuery } from '@/common/client';
import { ResolverInputTypes } from '@/zeus';
import { useList } from '@/lists/useList';
import { cn } from '@/lib/utils';
import { useCustomFields } from '@/custom_fields';

const getProducts = async (options: ResolverInputTypes['ProductListOptions']) => {
  const response = await adminApiQuery({
    products: [{ options }, { totalItems: true, items: { id: true, featuredAsset: { preview: true } } }],
  });
  return response.products;
};

export function ProductRelationInput() {
  const { value, setValue } = useCustomFields();
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    featuredAsset?: { preview: string };
  } | null>(null);
  const { objects: products, Paginate } = useList({
    route: async ({ page, perPage }) => {
      const products = await getProducts({ skip: (page - 1) * perPage, take: perPage });
      return { items: products.items, totalItems: products.totalItems };
    },
    listType: `modal-products-list`,
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
                  className="h-32 w-32 object-fill"
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
                  'w-1/4 cursor-pointer border-2 p-2',
                  selectedProduct?.id === product.id && 'border-blue-500',
                )}
                onClick={() => {
                  setSelectedProduct(product);
                  setValue(product.id);
                }}
              >
                <span>{product.id}</span>
                {product.featuredAsset && (
                  <img src={product.featuredAsset.preview} alt={product.id} className="h-32 w-32 object-fill" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <div className="flex w-full flex-col gap-2">
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
