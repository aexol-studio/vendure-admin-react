import React, { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components';
import { adminApiQuery } from '@/common/client';
import { useTranslation } from 'react-i18next';
import { LogicalOperator } from '@/zeus';
import { SearchCustomerType, searchCustomerSelector } from '@/graphql/draft_order';

interface Props {
  onSelect: (selected: SearchCustomerType) => void;
}

export const CustomerSearch: React.FC<Props> = ({ onSelect }) => {
  const { t } = useTranslation('orders');
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const [debouncedValue] = useDebounce(value, 500);
  const [results, setResults] = useState<SearchCustomerType[]>([]);

  useEffect(() => {
    const search = async () => {
      const data = await adminApiQuery()({
        customers: [
          {
            options: {
              take: 10,
              filter: {
                firstName: { contains: debouncedValue },
                lastName: { contains: debouncedValue },
                emailAddress: { contains: debouncedValue },
                id: { eq: debouncedValue },
              },
              filterOperator: LogicalOperator.OR,
            },
          },
          { items: searchCustomerSelector },
        ],
      });

      setResults(data.customers.items);
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
          className="absolute left-0 top-[100%+2] z-10  max-h-96 min-w-full max-w-full overflow-auto rounded-e border bg-black"
        >
          {results && results.length > 0 ? (
            results.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  onSelect(r);
                  ref.current?.blur();
                }}
                className="flex w-full flex-1 cursor-pointer flex-row items-center justify-between gap-6 p-4 dark:hover:bg-stone-800/50"
              >
                <div className="w-16">{r.id}</div>
                <div className="flex-1">{r.firstName}</div>
                <div className="flex-1">{r.lastName}</div>
                <div className="flex-1">{r.emailAddress}</div>
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
