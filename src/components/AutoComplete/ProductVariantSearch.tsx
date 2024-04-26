import React, { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import {
  Button,
  ImageWithPreview,
  Input,
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components';
import { adminApiQuery } from '@/common/client';
import { useTranslation } from 'react-i18next';
import { LogicalOperator } from '@/zeus';
import { SearchProductVariantType, searchProductVariantSelector } from '@/graphql/draft_order';
import { priceFormatter } from '@/utils';

interface Props {
  onSelectItem: (selected: SearchProductVariantType) => void;
}

///TODO Add clear select option

export const ProductVariantSearch: React.FC<Props> = ({ onSelectItem }) => {
  const { t } = useTranslation('orders');
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const [debouncedValue] = useDebounce(value, 500);
  const [results, setResults] = useState<SearchProductVariantType[]>([]);

  useEffect(() => {
    const search = async () => {
      const data = await adminApiQuery()({
        productVariants: [
          {
            options: {
              take: 10,
              filter: { name: { contains: debouncedValue }, sku: { contains: debouncedValue } },
              filterOperator: LogicalOperator.OR,
            },
          },
          { items: searchProductVariantSelector },
        ],
      });
      setResults(data.productVariants.items);
    };
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <div className="relative w-full">
      <Input
        ref={ref}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Type to search for customers..."
        value={value}
        className="min-w-full max-w-full"
        onChange={(e) => setValue(e.currentTarget.value)}
      />

      {focused && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="border-primary-200 dark:border-primary-700 absolute left-0 top-[100%+2px] z-10 min-w-full max-w-full border bg-primary-foreground shadow-lg"
        >
          <ScrollArea className="h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow noHover>
                  <TableHead>ID</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results && results.length > 0 ? (
                  results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>
                        <ImageWithPreview src={r.product?.featuredAsset?.preview} alt={r.name} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{r.product.name}</p>
                          <p className="text-xs">{r.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{priceFormatter(r.priceWithTax, r.currencyCode)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          onClick={() => {
                            onSelectItem(r);
                            ref.current?.blur();
                          }}
                        >
                          {t('create.addProduct')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <div className="p-4">{t('create.noItemsFound')}</div>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
{
  /* <div
                  key={r.productId + r.product.id + index}
                  className="flex w-full flex-1 flex-row items-center justify-between gap-6 p-4 dark:hover:bg-stone-800/50"
                >
                  <div className="w-16">{r.product.id}</div>
                  <div className="flex-1">{r.name}</div>
                  <div className="flex-1">{r.sku}</div>
                  <div className="flex-1">{r.product.name}</div>
                  <div className="w-16">
                    {r.priceWithTax} {r.currencyCode}
                  </div>
                  <ImageWithPreview src={r.product.featuredAsset?.preview} alt={r.name} />
                  <Button
                    variant="outline"
                    onClick={() => {
                      onSelectItem(r);
                      ref.current?.blur();
                    }}
                  >
                    {t('create.addProduct')}
                  </Button>
                </div> */
}
