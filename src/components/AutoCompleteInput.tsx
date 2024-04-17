import { CheckIcon } from '@radix-ui/react-icons';

import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { PromiseSearch, SearchResult } from '@/lists/models';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input, Search } from '@/components';
import { CommandInput } from '@/components/ui/command';

export function AutoCompleteInput<T extends PromiseSearch>({ route }: { route: T }) {
  const [data, setData] = useState<SearchResult[] | undefined>(undefined);
  const [value, setValue] = useState('');
  const [debouncedValue] = useDebounce(value, 500);
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const search = async () => {
      const data = await route({
        page: 1,
        perPage: 10,
        ...(debouncedValue && debouncedValue !== '' && { filter: { customerLastName: { contains: debouncedValue } } }),
      });
      setData(data);
    };
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <div className="relative">
      <Input
        ref={ref}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Type to search for customers..."
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
      />

      {focused && (
        <div className="absolute top-1 left-0 flex flex-row w-full bg-black">{data?.map((p) => p.children)}</div>
      )}
    </div>

    // <Command>
    //   <CommandInput
    //     ref={ref}
    //     placeholder="Type to search for customers..."
    //     value={value}
    //     onValueChange={(value) => setValue(value)}
    //   />
    //   <CommandList>
    //     <CommandEmpty>No customers found.</CommandEmpty>
    //     {data?.map((framework) => (
    //       <CommandItem
    //         key={framework.value}
    //         onSelect={() => {
    //           if (selected?.value === framework.value) {
    //             setSelected(null);
    //             setValue('');
    //           } else {
    //             setSelected(framework);
    //             setValue(framework.label);
    //           }
    //         }}
    //       >
    //         <div className="flex items-center justify-between w-full">{framework.children}</div>
    //       </CommandItem>
    //     ))}
    //   </CommandList>
    // </Command>
  );
}
