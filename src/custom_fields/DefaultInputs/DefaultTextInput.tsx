import { useCustomFields } from '..';
import { Input } from '@/components';

export function DefaultTextInput() {
  const { field, value, setValue } = useCustomFields();
  return (
    <div>
      <label
        htmlFor={field?.name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {field?.name}
      </label>
      <Input
        id={field?.name}
        type="text"
        value={value as string}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
    </div>
  );
}
