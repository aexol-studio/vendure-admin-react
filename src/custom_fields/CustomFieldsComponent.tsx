import React, { PropsWithChildren, Suspense, useEffect, useState } from 'react';
import { generateCustomFields } from './logic';
import { CustomFieldConfigType } from '@/graphql/base';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components';
import { SearchProductVariantType } from '@/graphql/draft_order';
import { useServer } from '@/state/server';

declare global {
  interface Window {
    __ADMIN_UI_CONFIG__: {
      components: { where: string; name: string; componentPath?: string }[];
    };
  }
}

export const CustomFieldsComponent: React.FC<{
  getValue: (field: CustomFieldConfigType) => string | number | boolean;
  setValue: (field: CustomFieldConfigType, data: string | number | boolean) => void;
  data: { variantToAdd: SearchProductVariantType };
}> = ({ getValue, setValue, data }) => {
  const customFields = useServer((p) => p.serverConfig?.customFieldConfig.OrderLine);
  const [rendered, setRendered] = useState<Record<string, { name: string; component: React.ReactElement }[]>>({});
  useEffect(() => {
    if (!customFields) return;
    generateCustomFields({ customFields }).then((fields) => {
      const result = fields.reduce(
        (acc, field) => {
          if (!acc[field.tab]) acc[field.tab] = [];
          acc[field.tab].push(field);
          return acc;
        },
        {} as Record<string, { name: string; component: React.ReactElement }[]>,
      );
      setRendered(result);
    });
  }, []);
  return (
    <div className="text-primary-background my-4 flex h-full w-full flex-col gap-4 rounded-lg bg-primary-foreground p-4">
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
            <div className="grid min-h-[200px] w-full grid-cols-2 gap-4">
              {fields.map((field) => {
                const _field = customFields?.find((f) => f.name === field.name);
                if (!_field) return null;
                return (
                  <CustomFieldsProvider
                    key={field.name}
                    field={_field}
                    data={data}
                    value={getValue(_field) || ''}
                    setValue={(data) => setValue(_field, data)}
                  >
                    <Suspense fallback={<span>Loading...</span>}>
                      <div className="w-1/2">{field.component}</div>
                    </Suspense>
                  </CustomFieldsProvider>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

type DynamicContext<DATA> = {
  field?: CustomFieldConfigType;
  value?: string | number | boolean;
  setValue: (data: string | number | boolean) => void;
  data?: DATA;
};

const CustomFieldsContext = React.createContext<DynamicContext<{ variantToAdd: SearchProductVariantType }>>({
  field: undefined,
  value: undefined,
  setValue: () => console.error('setValue not implemented'),
  data: undefined,
});
export const CustomFieldsProvider: React.FC<
  PropsWithChildren<DynamicContext<{ variantToAdd: SearchProductVariantType }>>
> = ({ children, ...value }) => {
  return <CustomFieldsContext.Provider value={value}>{children}</CustomFieldsContext.Provider>;
};

export const useCustomFields = () => {
  if (!React.useContext(CustomFieldsContext)) {
    throw new Error('useCustomFields must be used within a CustomFieldsProvider');
  }
  return React.useContext(CustomFieldsContext);
};
