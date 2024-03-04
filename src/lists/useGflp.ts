import { ModelTypes } from '@/zeus';
import { useState } from 'react';

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
  [P in keyof T]: {
    validate: (o: T[P]) => string[] | void;
    render?: (o: T[P], onChange: (c: T[P]) => void) => JSX.Element;
  };
}) => {
  const [state, setState] = useState<{
    [P in keyof T]: FormField<T[P]>;
  }>();
  const setField = <F extends keyof T>(field: F, value: T[F]) => {
    const invalid = config[field].validate(value);
    if (state) {
      state[field] = {
        ...state[field],
        value,
      };
      if (invalid) {
        state[field]['errors'] = invalid;
      } else {
        state[field]['validatedValue'] = value;
      }
    }
    setState(state);
  };
  return {
    state,
    setState,
    setField,
  };
};
