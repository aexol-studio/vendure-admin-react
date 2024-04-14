import { CustomFieldConfigType } from '@/graphql/base';

export type DefaultProps<T> = {
  field: CustomFieldConfigType;
  value: T;
  onChange: (e: T) => void;
};
