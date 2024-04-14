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

type RegisterComponentsType = {
  name: string;
  component: React.ReactElement;
  where: string;
};

export function registerCustomCustomFieldComponent({
  registerComponents,
  where,
  name,
  component,
}: {
  registerComponents: RegisterComponentsType[];
  where: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: any;
}) {
  registerComponents.push({ name, component, where });
}

export function generateCustomFields<T>({
  registerComponents,
  customFields,
  fieldsValue,
  setField,
}: {
  registerComponents: RegisterComponentsType[];
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
    const onChange = (e: boolean | string | number) => {
      switch (field.__typename) {
        case 'BooleanCustomFieldConfig':
          setField(field.name, e as unknown as T);
          break;
        case 'DateTimeCustomFieldConfig':
        case 'LocaleStringCustomFieldConfig':
        case 'TextCustomFieldConfig':
        case 'LocaleTextCustomFieldConfig':
        case 'StringCustomFieldConfig':
          setField(field.name, e as unknown as T);
          break;
        case 'FloatCustomFieldConfig':
          setField(field.name, (isNaN(parseFloat(e as string)) ? 0 : parseFloat(e as string)) as unknown as T);
          break;
        case 'IntCustomFieldConfig':
          setField(field.name, (isNaN(parseInt(e as string)) ? 0 : parseInt(e as string)) as unknown as T);
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
        setField(field.name, newEntries as unknown as T);
      };
      const onEntryChange = (i: number, e: boolean | string | number) => {
        const newEntries = (fieldsValue[field.name] as Record<string, T>[]).map((entry, j) =>
          j === i ? { ...entry, [field.name]: e } : entry,
        );
        setField(field.name, newEntries as unknown as T);
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange: (e: any) => onEntryChange(i, e),
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

function generateSingleFields({
  field,
  value,
  onChange,
}: {
  field: CustomFieldConfigType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: any;
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
