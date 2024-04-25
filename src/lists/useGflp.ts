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
    validate?: (o: T[P]) => string[] | void;
    initialValue?: T[P];
  };
}) => {
  const [state, _setState] = useState<
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
      const isToBeValidated = !!config[field]?.validate;
      const invalid = config[field]?.validate?.(value);
      state[field] =
        isToBeValidated && invalid && invalid.length > 0
          ? ({ value: value, initialValue: state[field]?.initialValue, errors: invalid } as FormField<T[F]>)
          : ({ value: value, initialValue: state[field]?.initialValue, validatedValue: value } as FormField<T[F]>);
      _setState(JSON.parse(JSON.stringify(state)));
    },
    [config, state],
  );

  const checkIfAllFieldsAreValid: () => boolean = useCallback(() => {
    let newState = { ...state };
    Object.keys(config).forEach((field) => {
      const fieldKey = field as keyof T;
      const fieldValue = newState[fieldKey];
      if (fieldValue && fieldKey) {
        const isToBeValidated = !!config[fieldKey]?.validate;
        const isInvalid = config[fieldKey]?.validate?.(fieldValue.value);
        newState = {
          ...newState,
          [fieldKey]:
            isToBeValidated && isInvalid && isInvalid.length > 0
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
    _setState(newState);
    return !Object.keys(config).some(
      (field) => config[field as keyof T]?.validate && !newState[field as keyof T]?.validatedValue,
    );
  }, [config, state]);

  const haveValidFields = useMemo(
    () =>
      !Object.keys(config).some(
        (field) => config[field as keyof T]?.validate && !state[field as keyof T]?.validatedValue,
      ),
    [config, state],
  );

  const setState = (value: T) => {
    let newState = { ...state };
    Object.keys(config).forEach((field) => {
      const fieldKey = field as keyof T;
      const fieldValue = newState[fieldKey];
      if (fieldValue && fieldKey && value[fieldKey]) {
        const isToBeValidated = !!config[fieldKey]?.validate;
        const isInvalid = config[fieldKey]?.validate?.(value[fieldKey]);
        newState = {
          ...newState,
          [fieldKey]:
            isToBeValidated && isInvalid && isInvalid.length > 0
              ? {
                  initialValue: fieldValue.initialValue,
                  value: value[fieldKey],
                  errors: isInvalid,
                }
              : {
                  initialValue: fieldValue.initialValue,
                  value: value[fieldKey],
                  validatedValue: value[fieldKey],
                },
        };
      }
    });
    _setState(newState);
  };

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
