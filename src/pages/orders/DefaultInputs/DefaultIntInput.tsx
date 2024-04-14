import React from 'react';
import { DefaultProps } from './types';
import { Input } from '@/components';

export const DefaultIntInput = (props: DefaultProps<number>) => {
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
        value={value}
        onChange={(e) => {
          if (typeof e.target.value === 'string') onChange(parseInt(e.target.value));
        }}
      />
    </div>
  );
};
