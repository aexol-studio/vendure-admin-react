import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  ParamObjectT,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Stack,
  Switch,
} from '@/components';
import { SearchAccordion } from './searchAccordion';
import { ModelTypes } from '@/zeus';

import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { Dropdown } from 'react-day-picker';
import { ChevronDown, CircleX } from 'lucide-react';
import { cn } from '@/lib/utils';

type CollectionFilterProps = {
  type: 'CollectionFilterParameter';
  filter: ModelTypes['CollectionFilterParameter'] | undefined;
  setFilterField: (
    filterField: keyof ModelTypes['CollectionFilterParameter'],
    fieldValue: ModelTypes['CollectionFilterParameter'][keyof ModelTypes['CollectionFilterParameter']],
  ) => void;
  setFilter: (filter?: ModelTypes['CollectionFilterParameter'] | undefined) => void;
  removeFilterField: (filterField: keyof ModelTypes['CollectionFilterParameter']) => void;
};
type FacetFilterProps = {
  type: 'FacetFilterParameter';
  filter: ModelTypes['FacetFilterParameter'] | undefined;
  setFilterField: (
    filterField: keyof ModelTypes['FacetFilterParameter'],
    fieldValue: ModelTypes['FacetFilterParameter'][keyof ModelTypes['FacetFilterParameter']],
  ) => void;
  setFilter: (filter?: ModelTypes['FacetFilterParameter'] | undefined) => void;
  removeFilterField: (filterField: keyof ModelTypes['FacetFilterParameter']) => void;
};
type OrderFilterProps = {
  type: 'OrderFilterParameter';
  filter: ModelTypes['OrderFilterParameter'] | undefined;
  setFilterField: (
    filterField: keyof ModelTypes['OrderFilterParameter'],
    fieldValue: ModelTypes['OrderFilterParameter'][keyof ModelTypes['OrderFilterParameter']],
  ) => void;
  setFilter: (filter?: ModelTypes['OrderFilterParameter'] | undefined) => void;
  removeFilterField: (filterField: keyof ModelTypes['OrderFilterParameter']) => void;
};
type ProductFilterProps = {
  type: 'ProductFilterParameter';
  filter: ModelTypes['ProductFilterParameter'] | undefined;
  setFilterField: (
    filterField: keyof ModelTypes['ProductFilterParameter'],
    fieldValue: ModelTypes['ProductFilterParameter'][keyof ModelTypes['ProductFilterParameter']],
  ) => void;
  setFilter: (filter?: ModelTypes['ProductFilterParameter'] | undefined) => void;
  removeFilterField: (filterField: keyof ModelTypes['ProductFilterParameter']) => void;
};

type Props = OrderFilterProps | ProductFilterProps | CollectionFilterProps | FacetFilterProps;

type InputType = 'StringOperators' | 'IDOperators' | 'BooleanOperators' | 'DateOperators' | 'NumberOperators';

const orderFilterFields: {
  name: keyof ModelTypes['OrderFilterParameter'];
  type: InputType;
}[] = [
  { name: 'active', type: 'BooleanOperators' },
  { name: 'additionalInformation', type: 'StringOperators' },
  { name: 'code', type: 'StringOperators' },
  { name: 'createdAt', type: 'DateOperators' },
  { name: 'currencyCode', type: 'StringOperators' },
  { name: 'customerLastName', type: 'StringOperators' },
  { name: 'id', type: 'IDOperators' },
  { name: 'orderPlacedAt', type: 'DateOperators' },
  { name: 'shipping', type: 'StringOperators' },
  { name: 'shippingWithTax', type: 'StringOperators' },
  { name: 'state', type: 'StringOperators' },
  { name: 'subTotal', type: 'NumberOperators' },
  { name: 'subTotalWithTax', type: 'NumberOperators' },
  { name: 'total', type: 'NumberOperators' },
  { name: 'totalQuantity', type: 'NumberOperators' },
  { name: 'totalWithTax', type: 'NumberOperators' },
  { name: 'transactionId', type: 'StringOperators' },
  { name: 'type', type: 'StringOperators' },
  { name: 'updatedAt', type: 'DateOperators' },
  { name: 'aggregateOrderId', type: 'IDOperators' },
  { name: 'getProforma', type: 'StringOperators' },
  { name: 'registeredOnCheckout', type: 'BooleanOperators' },
];

const productFilterFields: {
  name: keyof ModelTypes['ProductFilterParameter'];
  type: InputType;
}[] = [
  { name: 'facetValueId', type: 'IDOperators' },
  { name: 'enabled', type: 'BooleanOperators' },
  { name: 'id', type: 'IDOperators' },
  { name: 'createdAt', type: 'DateOperators' },
  { name: 'updatedAt', type: 'DateOperators' },
  { name: 'languageCode', type: 'StringOperators' },
  { name: 'name', type: 'StringOperators' },
  { name: 'slug', type: 'StringOperators' },
  { name: 'description', type: 'StringOperators' },
  { name: 'seoTitle', type: 'StringOperators' },
  { name: 'seoDescription', type: 'StringOperators' },
  { name: 'optionsOrder', type: 'StringOperators' },
  { name: 'sizes', type: 'StringOperators' },
  { name: 'finish', type: 'StringOperators' },
  { name: 'materials', type: 'StringOperators' },
  { name: 'payment', type: 'StringOperators' },
  { name: 'delivery', type: 'StringOperators' },
  { name: 'realization', type: 'StringOperators' },
  { name: 'discountBy', type: 'NumberOperators' },
];

export const Search: React.FC<Props> = ({ type, filter, removeFilterField, setFilterField, setFilter }) => {
  const { t } = useTranslation('common');
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdvanced, setIsAdvanced] = useState(() => {
    if (!filter) return false;
    if (
      type === 'OrderFilterParameter' &&
      filter.code?.contains &&
      filter.transactionId?.contains &&
      filter.customerLastName?.contains &&
      filter.code.contains === filter.transactionId.contains &&
      filter.code.contains === filter.customerLastName.contains &&
      Object.keys(filter).length === 3
    ) {
      return false;
    } else if (
      (type === 'FacetFilterParameter' || type === 'CollectionFilterParameter' || type === 'ProductFilterParameter') &&
      filter.name?.contains &&
      Object.keys(filter).length === 1
    ) {
      return false;
    } else {
      return true;
    }
  });

  const [defaultSearch, setDefaultSearch] = useState<string>(
    !isAdvanced ? (type === 'OrderFilterParameter' ? filter?.code?.contains || '' : filter?.name?.contains || '') : '',
  );
  const [debouncedSearch] = useDebounce(defaultSearch, 500);

  const toggleAdvanced = () => {
    if (isAdvanced) {
      setIsAdvanced(false);
      setFilter(undefined);
    } else {
      setIsAdvanced(true);
      setDefaultSearch('');
    }
  };
  useEffect(() => {
    if (!isAdvanced) {
      if (debouncedSearch && debouncedSearch !== '') {
        if (type === 'OrderFilterParameter') {
          setFilter({
            code: { contains: debouncedSearch },
            customerLastName: { contains: debouncedSearch },
            transactionId: { contains: debouncedSearch },
          });
        } else {
          setFilter({ name: { contains: debouncedSearch } });
        }
      } else {
        setFilter(undefined);
      }
    }
    //isAdvanced should ot be in dependencies
  }, [debouncedSearch, type]);

  const filtersToAdd = useMemo(
    () =>
      (type === 'OrderFilterParameter' ? orderFilterFields : []).filter(
        (i) => !Object.keys(filter || {}).includes(i.name),
      ),
    [type],
  );

  return (
    <div className="flex min-h-10 flex-1 justify-between gap-4 ">
      {isAdvanced ? (
        <div className="flex  gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {t('search.addFilter')} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[400px] overflow-y-auto">
              {filtersToAdd.map((i) => (
                <DropdownMenuItem onClick={() => setFilter({ ...filter, [i.name]: {} })}>
                  {t(`search.filterLabels.${i.name}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-wrap gap-2 place-self-start">
            {type === 'OrderFilterParameter' &&
              orderFilterFields.map((i) => (
                <>
                  {filter && i.name in filter && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <div
                          className={cn(
                            'inline-flex cursor-pointer items-center gap-2 rounded-full border bg-primary-foreground px-2.5 py-0.5 text-xs font-semibold hover:brightness-90',
                            !Object.keys({ ...filter[i.name] }).length && 'border-red-600',
                          )}
                        >
                          {t(`search.filterLabels.${i.name}`)}
                          <CircleX size={14} onClick={() => removeFilterField(i.name)} />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-80">
                        <div>{t('search.filterBy', { value: t(`search.filterLabels.${i.name}`).toLowerCase() })}</div>
                        {i.type === 'StringOperators' ? (
                          <div>
                            <Select defaultValue="contains">
                              <SelectTrigger>
                                <SelectValue placeholder="Select a fruit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Fruits</SelectLabel>
                                  <SelectItem value="apple">Apple</SelectItem>
                                  <SelectItem value="banana">Banana</SelectItem>
                                  <SelectItem value="blueberry">Blueberry</SelectItem>
                                  <SelectItem value="grapes">Grapes</SelectItem>
                                  <SelectItem value="pineapple">Pineapple</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : i.type === 'DateOperators' ? (
                          'DateOperators'
                        ) : i.type === 'IDOperators' ? (
                          'IDOperators'
                        ) : i.type === 'NumberOperators' ? (
                          'NumberOperators'
                        ) : (
                          'bool'
                        )}
                        <div className="grid gap-4"></div>
                      </PopoverContent>
                    </Popover>
                  )}
                </>
              ))}
          </div>
        </div>
      ) : (
        <Input
          className=" "
          placeholder={t(`search.${type}.placeholder`)}
          value={defaultSearch}
          onChange={(e) => setDefaultSearch(e.currentTarget.value)}
        />
      )}

      {/* <div className="flex h-[40px] items-center gap-2">
        <Switch id="advanceSearch" checked={isAdvanced} onClick={toggleAdvanced} />
        <Label className="text-nowrap" htmlFor="advanceSearch">
          {t('search.advanceToggle')}
        </Label>
      </div> */}
      {/* //Old one */}
      {/* {groupedAdvancedParams && (
        <Sheet>
          <SheetTrigger>
            <Button>{advancedSearch?.actionTitle}</Button>
          </SheetTrigger>
          <SheetContent className="w-[500px]">
            <SheetHeader>
              <SheetTitle>{advancedSearch?.title}</SheetTitle>
              <ScrollArea className="h-[calc(100vh-6rem)] pr-4">
                <Accordion type="multiple">
                  {groupedAdvancedParams.map((p) => {
                    return <SearchAccordion key={p.title} {...p} />;
                  })}
                </Accordion>
              </ScrollArea>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      )} */}
    </div>
  );
};
