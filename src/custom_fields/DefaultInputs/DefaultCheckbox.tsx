import { Checkbox } from '@/components';
import { useCustomFields } from '..';

export const DefaultCheckbox = () => {
  const { field, value, setValue } = useCustomFields();
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id={field?.name} checked={value as boolean} onCheckedChange={setValue} />
      <label
        htmlFor={field?.name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {field?.name}
      </label>
    </div>
  );
};
