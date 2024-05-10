import React, { useState } from 'react';
import {
  Accordion,
  Button,
  Input,
  ParamObjectT,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Stack,
} from '@/components';
import { SearchAccordion } from './searchAccordion';
import { ModelTypes } from '@/zeus';
import { useDebounce } from '@/hooks';

type FiltersType =
  | 'ProductFilterParameter'
  | 'CollectionFilterParameter'
  | 'OrderFilterParameter'
  | 'FacetFilterParameter'
  | 'ProductVariantFilterParameter'
  | 'AssetFilterParameter'
  | 'ProductFilterParameter';
  
interface Props<T extends FiltersType> {
  type: T;
  filter: ModelTypes[T];
  setFilterField: (filterField: keyof ModelTypes[T], fieldValue: ModelTypes[T][keyof ModelTypes[T]]) => void;
  removeFilterField: (filterField: keyof ModelTypes[T]) => void;
  resetFilter: () => void;
}

export function Search<T extends FiltersType>(props: Props<T>): JSX.Element {
  const { filter, removeFilterField, setFilterField, resetFilter, type } = props;
  const [isAdvanced, setIsAdvanced] = useState(false);

  const [defaultSearch, setDefaultSearch] = useState<string>(
    type === 'OrderFilterParameter' &&  ((filter as ModelTypes[typeof type]).) ? '' : ''),
  );
  const [debouncedSearch] = useDebounce(defaultSearch, 500);

  return (
    <Stack className="justify-end gap-4">
      {defaultSearch.param && (
        <Input placeholder={defaultSearch.placeholder} onChange={(e) => searchFilterField(e.currentTarget.value)} />
      )}
      {groupedAdvancedParams && (
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
      )}
    </Stack>
  );
}
