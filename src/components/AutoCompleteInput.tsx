import { CheckIcon } from '@radix-ui/react-icons';

import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { PromiseSearch } from '@/lists/models';

export function AutoCompleteInput<T extends PromiseSearch>({
  selected: initialSelected,
  onSelect,
  route,
}: {
  selected?: { value: string; label: string };
  onSelect: (value: Awaited<ReturnType<T>>[number] | null) => void;
  route: T;
}) {
  const [data, setData] = useState<{ value: string; label: string }[] | null>(null);
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(initialSelected ?? null);
  const [debouncedValue] = useDebounce(value, 500);

  useEffect(() => {
    const search = async () => {
      const data = await route({
        page: 1,
        perPage: 10,
        ...(debouncedValue && debouncedValue !== '' && { filter: { firstName: { contains: debouncedValue } } }),
      });
      setData(data);
    };
    search();
  }, [debouncedValue]);

  return (
    <Command>
      <CommandInput
        placeholder="Type to search for customers..."
        value={value}
        onValueChange={(value) => setValue(value)}
      />
      <CommandList>
        <CommandEmpty>No customers found.</CommandEmpty>
        {data?.map((framework) => (
          <CommandItem
            key={framework.value}
            onSelect={() => {
              if (selected?.value === framework.value) {
                onSelect(null);
                setSelected(null);
                setValue('');
              } else {
                onSelect(framework);
                setSelected(framework);
                setValue(framework.label);
              }
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div>{framework.label}</div>
              {value === framework.value && <CheckIcon />}
            </div>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
