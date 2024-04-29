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
  // DefaultListWrapper,
  // DefaultListLineWrapper,
} from './DefaultInputs';

export async function generateCustomFields({ customFields }: { customFields: CustomFieldConfigType[] }) {
  const { __ADMIN_UI_CONFIG__ } = window;
  const registeredComponents = __ADMIN_UI_CONFIG__.components;
  const fields: {
    name: string;
    component: React.ReactElement;
    tab: string;
  }[] = [];
  for (const field of customFields) {
    const ui = field.ui as Record<string, unknown>;
    const registered = ui && 'component' in ui && registeredComponents.find((c) => c.name === ui.component);
    const tab = ((ui && 'tab' in ui && ui?.tab) || 'General') as string;
    if (registered && registered.componentPath) {
      const Component = await import(registered.componentPath).then((m) => m.CustomComponent).catch(() => null);
      if (!Component) {
        console.log('Error loading component', registered.componentPath);
      } else {
        const component = <Component />;
        fields.push({ ...field, component, tab });
      }
    } else if (field.list) {
      //TODO: Implement list fields
      // fields.push({ ...field, component: <DefaultListWrapper {...generateSingleFields({ field })} />, tab });
      // fields.push({ ...field, component: <DefaultListLineWrapper {...generateSingleFields({ field })} />, tab });
    } else fields.push({ ...generateSingleFields({ field }), tab });
  }
  return fields;
}

function generateSingleFields({ field }: { field: CustomFieldConfigType }) {
  switch (field.__typename) {
    case 'BooleanCustomFieldConfig':
      return { ...field, component: <DefaultCheckbox /> };
    case 'DateTimeCustomFieldConfig':
      return { ...field, component: <DefaultTimeSelect /> };
    case 'FloatCustomFieldConfig':
      return { ...field, component: <DefaultFloatInput /> };
    case 'IntCustomFieldConfig':
      return { ...field, component: <DefaultIntInput /> };
    case 'StringCustomFieldConfig':
      return { ...field, component: <DefaultTextInput /> };
    case 'LocaleStringCustomFieldConfig':
      return { ...field, component: <DefaultTextInput /> };
    case 'TextCustomFieldConfig':
      return { ...field, component: <DefaultTextarea /> };
    case 'LocaleTextCustomFieldConfig':
      return { ...field, component: <DefaultTextarea /> };
    case 'RelationCustomFieldConfig':
      return { ...field, component: <DefaultRelationInput /> };
    default:
      //TODO: Implement other field types
      return { name: '🏗️', component: <span className="text-sm font-bold">Not implemented yet</span> };
  }
}
