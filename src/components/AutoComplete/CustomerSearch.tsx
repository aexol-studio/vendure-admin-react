import React, { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Input, ScrollArea, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components';
import { adminApiQuery } from '@/common/client';
import { useTranslation } from 'react-i18next';
import { LogicalOperator } from '@/zeus';
import { SearchCustomerType, searchCustomerSelector } from '@/graphql/draft_order';
import { cn } from '@/lib/utils';

interface Props {
  onSelect: (selected: SearchCustomerType) => void;
  selectedCustomer?: SearchCustomerType;
}

export const CustomerSearch: React.FC<Props> = ({ onSelect, selectedCustomer }) => {
  const { t } = useTranslation('orders');
  const ref = useRef<HTMLInputElement>(null);
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
    <div className="flex flex-col gap-4 py-2">
      <div>{t('create.selectCustomer.inputLabel')}</div>
      <Input
        placeholder={t('create.selectCustomer.placeholder')}
        ref={ref}
        value={value}
        className="min-w-full max-w-full"
        onChange={(e) => setValue(e.currentTarget.value)}
      />
      <Table className="w-full" containerClassName="h-fit max-h-[calc(80vh-330px)] overflow-y-auto relative">
        <TableHeader className="sticky top-0 bg-primary-foreground">
          <TableRow>
            <TableHead>{t('create.selectCustomer.id')}</TableHead>
            <TableHead>{t('create.selectCustomer.firstName')}</TableHead>
            <TableHead>{t('create.selectCustomer.lastName')}</TableHead>
            <TableHead>{t('create.selectCustomer.email')}</TableHead>
            <TableHead>{t('create.selectCustomer.phoneNumber')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((r) => (
            <TableRow
              className={cn(
                r.id === selectedCustomer?.id &&
                  'bg-stone-300/50 font-semibold hover:bg-stone-300/50 dark:bg-stone-500/50 hover:dark:bg-stone-500/50',
              )}
              onClick={() => onSelect(r)}
              key={r.id}
            >
              <TableCell>{r.id}</TableCell>
              <TableCell>{r.firstName}</TableCell>
              <TableCell>{r.lastName}</TableCell>
              <TableCell>{r.emailAddress}</TableCell>
              <TableCell>{r.phoneNumber}</TableCell>
            </TableRow>
          ))}
          {results.map((r) => (
            <TableRow
              className={cn(
                r.id === selectedCustomer?.id &&
                  'bg-stone-300/50 font-semibold hover:bg-stone-300/50 dark:bg-stone-500/50 hover:dark:bg-stone-500/50',
              )}
              onClick={() => onSelect(r)}
              key={r.id}
            >
              <TableCell>{r.id}</TableCell>
              <TableCell>{r.firstName}</TableCell>
              <TableCell>{r.lastName}</TableCell>
              <TableCell>{r.emailAddress}</TableCell>
              <TableCell>{r.phoneNumber}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
