import { ModelTypes } from '@/zeus';
import { useCallback, useState } from 'react';

type FormField<T> = {
  initialValue?: T;
  value: T;
} & (
  | {
      errors: never;
      validatedValue: T;
    }
  | {
      errors: string[];
      validatedValue: never;
    }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useGFFLP = <T extends keyof ModelTypes, Z extends keyof ModelTypes[T]>(key: T, ...pick: Z[]) =>
  useFFLP<Pick<ModelTypes[T], Z>>;

export const useFFLP = <T>(config: {
  [P in keyof T]?: {
    validate: (o: T[P]) => string[] | void;
    initialValue?: T[P];
  };
}) => {
  const [state, setState] = useState<
    Partial<{
      [P in keyof T]: FormField<T[P]>;
    }>
  >({
    ...(Object.fromEntries(
      Object.entries(config).map(([k, v]) => [k, { value: 'initialValue' in v ? v.initialValue : '', errors: [] }]),
    ) as Partial<{
      [P in keyof T]: FormField<T[P]>;
    }>),
  });
  const setField = useCallback(
    <F extends keyof T>(field: F, value: T[F]) => {
      const invalid = config[field]?.validate(value);
      if (state) {
        state[field] = {
          ...state[field],
          value,
        };
        if (invalid) {
          state[field]!['errors'] = invalid;
        } else {
          state[field]!['validatedValue'] = value;
        }
      }
      setState(JSON.parse(JSON.stringify(state)));
    },
    [config, state],
  );
  return {
    state,
    setState,
    setField,
  };
};

export const setInArrayBy = <T>(list: T[], fn: (x: T) => boolean, element: T) => {
  const ll = list.find((e) => !fn(e));
  return list
    .filter((e) => fn(e))
    .concat({
      ...ll,
      ...element,
    });
};
