import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { manageSearchParam } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';
import { ParamObjectT, Input, Label } from '@/components';

interface SearchAccordionInputProps {
  mainParam?: string;
  param: ParamObjectT;
}

export const SearchAccordionInput: React.FC<SearchAccordionInputProps> = ({ param, mainParam }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const debounced = useDebouncedCallback((paramKeyValue: string) => {
    manageSearchParam({
      param: param.param ?? mainParam,
      paramKey: param.paramKey,
      paramKeyValue,
      searchParams,
      setSearchParams,
    });
  }, 400);

  return (
    <div className=" flex flex-col">
      {param.label && <Label className="pb-2 text-[0.75rem] text-stone-400">{param.label}</Label>}
      <Input
        defaultValue={
          searchParams
            .getAll(param.param ?? mainParam ?? '')
            .find((key) => key.includes(param.paramKey))
            ?.split(',')[0]
        }
        className="space-y-8"
        placeholder={param.placeholder}
        onChange={(e) => debounced(e.currentTarget.value)}
      />
    </div>
  );
};
