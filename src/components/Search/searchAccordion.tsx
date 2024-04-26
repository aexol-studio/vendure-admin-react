import React, { useEffect, useState } from 'react';

import { SearchAccordionInput } from './searchAccordionInput';

import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { AccordionContent, AccordionItem, AccordionTrigger, ParamObjectT } from '@/components';

interface SearchAccordionProps {
  title: string;
  mainParam?: string | undefined;
  array: ParamObjectT[][];
}

export const SearchAccordion: React.FC<SearchAccordionProps> = ({ array, title, mainParam }) => {
  const [searchParams] = useSearchParams();
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    let mainParamCount = 0;
    if (mainParam) mainParamCount = searchParams.getAll(mainParam).length;
    const arrayParamsCount = array.reduce((acc, curr) => {
      let count = 0;
      curr.forEach(({ param }) => {
        if (param) count += searchParams.getAll(param).length;
      });
      return (acc += count);
    }, 0);
    setActiveCount(mainParamCount + arrayParamsCount);
  }, [searchParams, array, mainParam]);
  return (
    <AccordionItem key={title} value={title}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex grow justify-between pr-4">
          <span>{title}</span>
          <span className={cn('text-stone-700', activeCount > 0 && 'text-stone-100')}>{`(${activeCount})`}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="gap-10">
        <div className="flex flex-col gap-4 pt-2">
          {array.map((pair) => (
            <div key={pair[0].paramKey} className="flex items-end gap-2">
              {pair.map((param, i) => {
                if (param.param || mainParam)
                  return <SearchAccordionInput key={`${param.paramKey}-${i}`} param={param} mainParam={mainParam} />;
              })}
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
