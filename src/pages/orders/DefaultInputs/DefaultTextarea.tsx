import { DefaultProps } from './types';
import { Textarea } from '@/components';

export function DefaultTextarea<T>(props: DefaultProps<T>) {
  const { value, onChange, field } = props;
  return (
    <div>
      <label
        htmlFor={field.name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {field.name}
      </label>
      <Textarea
        id={field.name}
        value={value as string}
        onChange={(e) => {
          if (typeof e.target.value === 'string') onChange(e.target.value as T);
        }}
      />
    </div>
  );
}
