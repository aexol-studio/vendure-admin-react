import { DefaultProps } from './types';
import { Input } from '@/components';

export function DefaultTextInput<T>(props: DefaultProps<T>) {
  const { field, value, onChange } = props;
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
        type="text"
        value={value as string}
        onChange={(e) => {
          if (typeof e.target.value === 'string') onChange(e.target.value as T);
        }}
      />
    </div>
  );
}
