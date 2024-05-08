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
import { apiCall } from '@/graphql/client';
import { useTranslation } from 'react-i18next';
import {
  ProductVariantType,
  SearchProductVariantType,
  productVariantSelector,
  searchProductVariantSelector,
} from '@/graphql/draft_order';
import { priceFormatter } from '@/utils';
import { CircleX } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onSelectItem: (selected: ProductVariantType) => void;
}

export const ProductVariantSearch: React.FC<Props> = ({ onSelectItem }) => {
  const { t } = useTranslation('orders');
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const [debouncedValue] = useDebounce(value, 500);
  const [results, setResults] = useState<SearchProductVariantType[]>([]);

  useEffect(() => {
    const search = async () => {
      const data = await apiCall('query')({
        search: [
          {
            input: { take: 10, groupByProduct: false, term: debouncedValue },
          },
          { items: searchProductVariantSelector },
        ],
      });
      setResults(data.search.items);
    };
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  console.log(results);

  return (
    <div className="relative w-full">
      <Input
        ref={ref}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t('searchProduct.placeholder')}
        value={value}
        className="min-w-full max-w-full"
        onChange={(e) => setValue(e.currentTarget.value)}
      />
      {value !== '' && (
        <CircleX
          className="absolute right-3 top-3 z-10 h-4 w-4 cursor-pointer"
          onClick={(e) => {
            setValue('');
            ref.current?.focus();
          }}
        />
      )}
      {focused && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="border-primary-200 dark:border-primary-700 absolute left-0 top-[100%+2px] z-10 min-w-full max-w-full border bg-primary-foreground shadow-lg"
        >
          <ScrollArea className="h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow noHover>
                  <TableHead>{t('searchProduct.id')}</TableHead>
                  <TableHead>{t('searchProduct.image')}</TableHead>
                  <TableHead>{t('searchProduct.name')}</TableHead>
                  <TableHead>{t('searchProduct.price')}</TableHead>
                  <TableHead>{t('searchProduct.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results && results.length > 0 ? (
                  results.map((r) => (
                    <TableRow key={r.productVariantId}>
                      <TableCell>{r.productVariantId}</TableCell>
                      <TableCell>
                        <ImageWithPreview src={r.productAsset?.preview} alt={r.productVariantName} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{r.productVariantName}</p>
                          <p className="text-sm">{r.productName}</p>
                          <p className="text-xs">{r.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {priceFormatter(
                          r.priceWithTax.__typename === 'SinglePrice'
                            ? r.priceWithTax.value
                            : { from: r.priceWithTax.min, to: r.priceWithTax.max },
                          r.currencyCode,
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const { productVariant } = await apiCall('query')({
                              productVariant: [{ id: r.productVariantId }, productVariantSelector],
                            });
                            if (productVariant) {
                              onSelectItem(productVariant);
                              ref.current?.blur();
                            } else {
                              toast.error(t('toasts.productVariantLoadingError'));
                            }
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
