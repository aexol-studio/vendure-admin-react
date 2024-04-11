import { Input, InputProps } from '@/components/ui/input';
import { useDebounce } from '@/hooks';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface Props extends InputProps {
  inputValue?: string;
  onDebounceChange: (newValue: string) => void;
  valueIsDecimal?: boolean;
}

export const DebounceTextInput: React.FC<Props> = ({
  onDebounceChange,
  inputValue,
  valueIsDecimal,
  className,
  value,
  ...props
}) => {
  const [value, setValue] = useState(value || '');
  const debouncedValue = useDebounce(value);

  useEffect(() => {
    if (
      currentFieldValueType &&
      (currentFieldValueType.type === FilterFieldType.IDOperators ||
        currentFieldValueType.type === FilterFieldType.StringOperators)
    ) {
      if (optionValue !== debouncedOptionStringValue) {
        if (debouncedOptionStringValue === '') {
          setOptionValue(undefined);
        } else {
          setOptionValue(debouncedOptionStringValue);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedOptionStringValue, currentFieldValueType]);

  return (
    <Input
      type={valueIsDecimal ? 'number' : 'text'}
      value={optionValue}
      onChange={(event) => setOptionValue(event.target.value)}
      className={cn('max-w-sm', className)}
      {...props}
    />
  );
};
