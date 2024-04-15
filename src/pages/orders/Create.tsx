import { adminApiQuery } from '@/common/client';
import { Stack } from '@/components/Stack';
import { CustomFieldConfigSelector, CustomFieldConfigType } from '@/graphql/base';
import { useGFFLP } from '@/lists/useGflp';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
// import { useTranslation } from 'react-i18next';

import { registerCustomFieldComponent, generateCustomFields } from './logic';
import { DefaultProps } from './DefaultInputs/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components';

const CustomComponent = (props: DefaultProps<boolean>) => {
  const { value, onChange } = props;
  return (
    <div>
      <input type="checkbox" checked={value} onChange={() => onChange(!value)} />
      <label>Super testowy component</label>
    </div>
  );
};

const registerComponents: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<DefaultProps<any>>;
  where: string;
}[] = [];

export const OrderCreatePage = () => {
  // const { t } = useTranslation('orders');
  const [customFields, setCustomFields] = useState<CustomFieldConfigType[]>([]);
  const { state, setField } = useGFFLP('AddItemToDraftOrderInput', 'customFields')({});

  useEffect(() => {
    const fetch = async () => {
      const { globalSettings } = await adminApiQuery()({
        globalSettings: { serverConfig: { customFieldConfig: { OrderLine: CustomFieldConfigSelector } } },
      });
      setCustomFields(globalSettings.serverConfig.customFieldConfig.OrderLine);
      Object.values(globalSettings.serverConfig.customFieldConfig.OrderLine).forEach((value) => {
        let init;
        if (value.list) {
          init = [];
        } else {
          switch (value.__typename) {
            case 'BooleanCustomFieldConfig':
              init = false;
              break;
            case 'FloatCustomFieldConfig':
            case 'IntCustomFieldConfig':
              init = 0;
              break;
            case 'DateTimeCustomFieldConfig':
            case 'LocaleStringCustomFieldConfig':
            case 'TextCustomFieldConfig':
            case 'LocaleTextCustomFieldConfig':
            case 'StringCustomFieldConfig':
              init = '';
              break;
          }
        }
        setField('customFields', { ...state.customFields?.value, [value.name]: init });
      });
      registerCustomFieldComponent({
        registerComponents,
        where: 'order-create',
        // WE SHOULD TAKE A CARE OF PLACE WHERE WE ARE AND WHERE WE ARE IMPLEMENTING THIS
        name: 'custom-boolean-form-input', // THOSE NAMES COMES FROM MICHEAL UI
        component: CustomComponent,
      });
    };
    fetch();
  }, []);

  const rendered = useMemo(() => {
    return generateCustomFields({
      registerComponents,
      customFields,
      fieldsValue: state.customFields?.value || {},
      setField: (name, value) => setField('customFields', { ...state.customFields?.value, [name]: value }),
    }).reduce(
      (acc, field) => {
        if (!acc[field.tab]) acc[field.tab] = [];
        acc[field.tab].push(field);
        return acc;
      },
      {} as Record<string, { name: string; component: React.ReactElement }[]>,
    );
  }, [customFields, state]);

  return (
    <Stack>
      <div className="w-full p-4 bg-primary-foreground text-primary-background rounded-lg flex flex-col gap-4">
        <span className="text-lg font-semibold">Custom fields</span>
        <Tabs className="w-full" defaultValue="General">
          <TabsList className="w-full justify-start">
            {Object.keys(rendered).map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(rendered).map(([tab, fields]) => (
            <TabsContent key={tab} value={tab}>
              <div className="flex flex-wrap">
                {fields.map((field) => (
                  <div className="w-1/2" key={field.name}>
                    {field.component}
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Stack>
  );
};
