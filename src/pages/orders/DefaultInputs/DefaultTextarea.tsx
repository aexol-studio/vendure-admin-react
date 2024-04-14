import React from 'react';
import { DefaultProps } from './types';
import { Textarea } from '@/components';

export const DefaultTextarea = (props: DefaultProps<string>) => {
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
        value={value}
        onChange={(e) => {
          if (typeof e.target.value === 'string') onChange(e.target.value);
        }}
      />
    </div>
  );
};
