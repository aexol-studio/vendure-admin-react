import React, { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Button, ImageWithPreview, Input } from '@/components';
import { adminApiQuery } from '@/common/client';
import { useTranslation } from 'react-i18next';
import { LogicalOperator } from '@/zeus';
import { SearchProductVariantType, searchProductVariantSelector } from '@/graphql/draft_order';

interface Props {
  onSelectItem: (selected: SearchProductVariantType) => void;
}

///TODO Add clear select option

export const AutoCompleteSearchInput: React.FC<Props> = ({ onSelectItem }) => {
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
          className="absolute left-0 top-[100%+2]  z-10 max-h-96 min-w-full max-w-full overflow-auto border bg-black"
        >
          {results && results.length > 0 ? (
            results.map((r, index) => (
              <div
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
              </div>
            ))
          ) : (
            <div className="p-4">{t('create.noItemsFound')}</div>
          )}
        </div>
      )}
    </div>
  );
};
