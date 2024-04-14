import { CustomFieldConfigType } from '@/graphql/base';

export type DefaultChangeEvent<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : never;

export type DefaultProps<T> = {
  field: CustomFieldConfigType;
  value: T;
  onChange: (e: DefaultChangeEvent<T>) => void;
};
