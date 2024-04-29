import React from 'react';
import {
  Accordion,
  Button,
  Input,
  ParamObjectT,
  ScrollArea,
  SearchPropsI,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Stack,
} from '@/components';
import { SearchAccordion } from './searchAccordion';

export const Search: React.FC<SearchPropsI & { searchFilterField: (filterField: string) => void }> = ({
  advancedSearch,
  defaultSearch,
  searchFilterField,
}) => {
  const groupedAdvancedParams = advancedSearch?.paramsArray.map((p) => {
    const array = p.array.reduce((acc, cur) => {
      if (acc[acc.length - 1] && acc[acc.length - 1].length == 1) {
        acc[acc.length - 1].push(cur);
      } else {
        acc.push([cur]);
      }
      return acc;
    }, [] as ParamObjectT[][]);
    return { ...p, array };
  });

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
};
