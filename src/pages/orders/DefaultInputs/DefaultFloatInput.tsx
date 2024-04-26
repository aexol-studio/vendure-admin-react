import { DefaultProps } from './types';
import { Input } from '@/components';

export function DefaultFloatInput<T>(props: DefaultProps<T>) {
  const { value, onChange, field } = props;
  return (
    <div>
      <label
        htmlFor={field.name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {field.name}
      </label>
      <Input
        id={field.name}
        type="number"
        value={value as string}
        onChange={(e) => {
          if (typeof e.target.value === 'string') onChange(parseFloat(e.target.value || '0') as T);
        }}
      />
    </div>
  );
}
