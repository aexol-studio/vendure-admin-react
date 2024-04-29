import { useCustomFields } from '..';
import { Textarea } from '@/components';

export function DefaultTextarea() {
  const { field, value, setValue } = useCustomFields();
  return (
    <div>
      <label
        htmlFor={field?.name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {field?.name}
      </label>
      <Textarea id={field?.name} value={value as string} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
}
