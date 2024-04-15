import { CustomFieldConfigType } from '@/graphql/base';
import React from 'react';
import {
  DefaultCheckbox,
  DefaultTimeSelect,
  DefaultFloatInput,
  DefaultIntInput,
  DefaultTextInput,
  DefaultTextarea,
  DefaultRelationInput,
  DefaultListWrapper,
  DefaultListLineWrapper,
} from './DefaultInputs';

type RegisterComponentsType<P> = {
  name: string;
  component: React.ComponentType<P>;
  where: string;
};

export function registerCustomFieldComponent<P>({
  registerComponents,
  where,
  name,
  component,
}: {
  registerComponents: RegisterComponentsType<P>[];
  where: string;
  name: string;
  component: React.ComponentType<P>;
}) {
  if (registerComponents.find((c) => c.name === name)) {
    console.error(`Component ${name} already registered`);
    return;
  }
  if (typeof component !== 'function' || !(component.prototype instanceof React.Component)) {
    console.error(`Component ${name} is not a valid React component`);
    return;
  }

  console.log(`Registering component ${name} in ${where}`);
  registerComponents.push({ name, component, where });
}

export function generateCustomFields<T, P>({
  registerComponents,
  customFields,
  fieldsValue,
  setField,
}: {
  registerComponents: RegisterComponentsType<P>[];
  customFields: CustomFieldConfigType[];
  fieldsValue: Record<string, T>;
  setField: (name: string, value: T) => void;
}) {
  const fields: {
    name: string;
    component: React.ReactElement;
    tab: string;
  }[] = [];
  for (const field of customFields) {
    const registered =
      field.ui && 'component' in field.ui && registerComponents.find((c) => c.name === field.ui.component);
    const value = fieldsValue[field.name];
    const tab = field.ui?.tab || 'General';
    const onChange = (e: T) => {
      switch (field.__typename) {
        case 'BooleanCustomFieldConfig':
          setField(field.name, e as T);
          break;
        case 'DateTimeCustomFieldConfig':
        case 'LocaleStringCustomFieldConfig':
        case 'TextCustomFieldConfig':
        case 'LocaleTextCustomFieldConfig':
        case 'StringCustomFieldConfig':
          setField(field.name, e as T);
          break;
        case 'FloatCustomFieldConfig':
          setField(field.name, (isNaN(parseFloat(e as string)) ? 0 : parseFloat(e as string)) as T);
          break;
        case 'IntCustomFieldConfig':
          setField(field.name, (isNaN(parseInt(e as string)) ? 0 : parseInt(e as string)) as T);
          break;
      }
    };
    if (registered) {
      const component = React.cloneElement(<registered.component />, { field, value, onChange });
      fields.push({ ...field, component, tab });
    } else if (field.list) {
      const addNewEntry = () => {
        setField(field.name, [
          ...(fieldsValue[field.name] as Record<string, T>[]),
          { [field.name]: '' },
        ] as unknown as T);
      };
      const removeEntry = (i: number) => {
        const newEntries = (fieldsValue[field.name] as Record<string, T>[]).filter((_, j) => j !== i);
        setField(field.name, newEntries as T);
      };
      const onEntryChange = (i: number, e: T) => {
        const newEntries = (fieldsValue[field.name] as Record<string, T>[]).map((entry, j) =>
          j === i ? { ...entry, [field.name]: e } : entry,
        );
        setField(field.name, newEntries as T);
      };
      fields.push({
        ...field,
        tab,
        component: (
          <DefaultListWrapper field={field} addNewEntry={addNewEntry}>
            {fieldsValue[field.name] &&
              (fieldsValue[field.name] as Record<string, T>[]).map((entry, i) => {
                const SingleField = generateSingleFields({
                  field,
                  value: entry[field.name],
                  onChange: (e: T) => onEntryChange(i, e),
                });
                if (!SingleField) {
                  console.log('Unknown field type while rendering list', field);
                  return null;
                }
                const { component } = SingleField;
                return (
                  <DefaultListLineWrapper key={i} removeEntry={() => removeEntry(i)}>
                    {component}
                  </DefaultListLineWrapper>
                );
              })}
          </DefaultListWrapper>
        ),
      });
    } else fields.push({ ...generateSingleFields({ field, value, onChange }), tab });
  }
  return fields;
}

function generateSingleFields<T>({
  field,
  value,
  onChange,
}: {
  field: CustomFieldConfigType;
  value: T;
  onChange: (e: T) => void;
}) {
  const props = { field, value, onChange };
  switch (field.__typename) {
    case 'BooleanCustomFieldConfig':
      return { ...field, component: <DefaultCheckbox {...props} /> };
    case 'DateTimeCustomFieldConfig':
      return { ...field, component: <DefaultTimeSelect {...props} /> };
    case 'FloatCustomFieldConfig':
      return { ...field, component: <DefaultFloatInput {...props} /> };
    case 'IntCustomFieldConfig':
      return { ...field, component: <DefaultIntInput {...props} /> };
    case 'StringCustomFieldConfig':
      return { ...field, component: <DefaultTextInput {...props} /> };
    case 'LocaleStringCustomFieldConfig':
      return { ...field, component: <DefaultTextInput {...props} /> };
    case 'TextCustomFieldConfig':
      return { ...field, component: <DefaultTextarea {...props} /> };
    case 'LocaleTextCustomFieldConfig':
      return { ...field, component: <DefaultTextarea {...props} /> };
    case 'RelationCustomFieldConfig':
      return { ...field, component: <DefaultRelationInput {...props} /> };
    default:
      //TODO: Implement other field types
      return { name: '🏗️', component: <span className="font-bold text-sm">Not implemented yet</span> };
  }
}
