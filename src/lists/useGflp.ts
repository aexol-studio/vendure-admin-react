import { ModelTypes } from '@/zeus';
import { useCallback, useMemo, useState } from 'react';

type FormField<T> = {
  initialValue?: T;
  value: T;
} & ({ errors: never; validatedValue: T } | { errors: string[]; validatedValue: never });

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
      Object.keys(config).map((v) => [v, { value: config[v as keyof T]?.initialValue as T[keyof T] }]),
    ) as Partial<{
      [P in keyof T]: FormField<T[P]>;
    }>),
  });
  const setField = useCallback(
    <F extends keyof T>(field: F, value: T[F]) => {
      const invalid = config[field]?.validate(value);
      state[field] =
        invalid && invalid.length > 0
          ? ({ value: value, initialValue: state[field]?.initialValue, errors: invalid } as FormField<T[F]>)
          : ({ value: value, initialValue: state[field]?.initialValue, validatedValue: value } as FormField<T[F]>);
      setState(JSON.parse(JSON.stringify(state)));
    },
    [config, state],
  );

  const checkIfAllFieldsAreValid: () => boolean = useCallback(() => {
    let newState = { ...state };
    Object.keys(config).forEach((field) => {
      const fieldKey = field as keyof T;
      const fieldValue = newState[fieldKey];
      console.log('------------');
      console.log('field', field);
      console.log('fieldKey', fieldKey);

      console.log('fieldValue', fieldValue);
      if (fieldValue && fieldKey) {
        const isInvalid = config[fieldKey]?.validate(fieldValue.value);
        console.log(fieldKey, isInvalid);

        newState = {
          ...newState,
          [fieldKey]:
            isInvalid && isInvalid.length > 0
              ? {
                  initialValue: fieldValue.initialValue,
                  value: fieldValue.value,
                  errors: isInvalid,
                }
              : {
                  initialValue: fieldValue.initialValue,
                  value: fieldValue.value,
                  validatedValue: fieldValue.value,
                },
        };
      }
    });
    setState(newState);
    console.log(newState);
    console.log('all valid?', !Object.keys(config).some((field) => !newState[field as keyof T]?.validatedValue));

    return !Object.keys(config).some((field) => !newState[field as keyof T]?.validatedValue);
  }, [config, state]);

  const haveValidFields = useMemo(
    () => Object.keys(config).some((field) => !state[field as keyof T]?.validatedValue),
    [config, state],
  );

  return {
    state,
    setState,
    setField,
    checkIfAllFieldsAreValid,
    haveValidFields,
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
