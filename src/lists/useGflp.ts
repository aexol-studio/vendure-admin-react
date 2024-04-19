import { ModelTypes } from '@/zeus';
import { useCallback, useEffect, useState } from 'react';

type FormField<T> = {
  initialValue?: T;
  value: T;
  error: string | undefined;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useGFFLP = <T extends keyof ModelTypes, Z extends keyof ModelTypes[T]>(key: T, ...pick: Z[]) =>
  useFFLP<Pick<ModelTypes[T], Z>>;

export const useFFLP = <T>(config: {
  [P in keyof T]?: {
    validate: (o: T[P]) => { isValid: false; errorMsg: string } | { isValid: true };
    initialValue?: T[P];
  };
}) => {
  const [state, setState] = useState<{ [P in keyof T]: FormField<T[P]> }>({
    ...(Object.fromEntries(
      Object.keys(config).map((k) => [k, { value: config[k as keyof T]?.initialValue || '' }]),
    ) as { [P in keyof T]: FormField<T[P]> }),
  });
  const setField = useCallback(
    <F extends keyof T>(field: F, value: T[F]) => {
      const newState = { ...state };
      const invalid = config[field]?.validate(value);

      newState[field] = { ...newState[field], value };
      if (invalid && !invalid.isValid) {
        newState[field]!['error'] = invalid.errorMsg;
      } else {
        newState[field]!['error'] = undefined;
      }
      setState(JSON.parse(JSON.stringify(newState)));
    },
    [config, state],
  );

  const validateAllFields = useCallback(() => {
    const newState = { ...state };
    Object.keys(config).forEach((field) => {
      const fieldValue = newState[field as keyof T];
      if (fieldValue) {
        const isValid = config[field as keyof T]?.validate(fieldValue.value);
        if (isValid && !isValid.isValid) {
          newState[field as keyof T] = {
            ...newState[field as keyof T],
            error: isValid.errorMsg,
          };
        } else {
          newState[field as keyof T] = {
            ...newState[field as keyof T],
            validatedValue: newState[field as keyof T]!.value,
            error: undefined,
          };
        }
      }
    });
    setState(newState);
  }, [config, state]);

  return {
    state,
    setState,
    setField,
    validateAllFields,
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
