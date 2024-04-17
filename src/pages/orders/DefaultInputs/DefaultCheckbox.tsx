import React from 'react';
import { DefaultProps } from './types';
import { Checkbox } from '@/components';

export function DefaultCheckbox<T>(props: DefaultProps<T>) {
  const { field, value, onChange } = props;
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={field.name}
        checked={value as boolean}
        onCheckedChange={(e) => {
          if (typeof e === 'boolean') onChange(e as T);
        }}
      />
      <label
        htmlFor={field.name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {field.name}
      </label>
    </div>
  );
}
