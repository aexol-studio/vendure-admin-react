import { adminApiQuery } from '@/common/client';
import { Stack } from '@/components/Stack';
import { CustomFieldConfigSelector, CustomFieldConfigType } from '@/graphql/base';
import { useGFFLP } from '@/lists/useGflp';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
// import { useTranslation } from 'react-i18next';

import { registerCustomFieldComponent, generateCustomFields } from './logic';
import { DefaultProps } from './DefaultInputs/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components';
import { ChevronLeft, PlusCircle, Upload } from 'lucide-react';

import { CustomerSelectCard } from './_components/CustomerSelectCard';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AddressCard } from './_components/AddressCard';
import { AutoCompleteInput } from '@/components/AutoCompleteInput';

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
    <main>
      <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="max-w-[1200px] w-full mx-auto grid flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
            {/* <Button variant="outline" size="icon" className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button> */}
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              Draft order
            </h1>
            <Badge variant="destructive" className="ml-auto sm:ml-0">
              Draft
            </Badge>
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
              <Button variant="outline" size="sm">
                Discard
              </Button>
              <Button size="sm">Complete draft order</Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
              <Card x-chunk="dashboard-07-chunk-0">
                <CardHeader>
                  <CardTitle>Add item to draft order</CardTitle>
                  <CardDescription>Here you can add items to draft order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-3">
                      <Label htmlFor="product">Product</Label>
                      <AutoCompleteInput
                        route={async ({ filter }) => {
                          const data = await adminApiQuery()({
                            products: [{ options: { take: 10, filter } }, { items: { id: true }, totalItems: true }],
                          });
                          return data.products.items.map((product) => ({ value: product.id, label: product.id }));
                        }}
                      />
                    </div>
                    <Card>
                      <CardContent className="p-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <img
                                    alt="Product image"
                                    className="aspect-square w-10 rounded-md object-cover"
                                    height="40"
                                    src="https://shop.dev.minko.aexol.work/assets/mainafter__preview.webp?preset=small"
                                    width="40"
                                  />
                                  <span className="font-semibold">T-Shirt</span>
                                </div>
                              </TableCell>
                              <TableCell>GGPC-001</TableCell>
                              <TableCell>2</TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost">
                                      Add item
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[90vw] h-[90vh]">
                                    <form>
                                      <div className="flex">
                                        {/* fake product */}
                                        <img
                                          alt="Product image"
                                          className="aspect-square w-14 rounded-md object-cover"
                                          height="56"
                                          src="https://shop.dev.minko.aexol.work/assets/mainafter__preview.webp?preset=small"
                                          width="56"
                                        />
                                        <div className="grid gap-1">
                                          <span className="font-semibold">T-Shirt</span>
                                          <span className="text-muted-foreground">SKU: GGPC-001</span>
                                        </div>
                                      </div>
                                      <div className="flex items-end justify-between gap-2">
                                        <div className="grid gap-3">
                                          <Label htmlFor="quantity">Quantity</Label>
                                          <Input id="quantity" type="number" />
                                        </div>
                                        <Button size="sm">Add item</Button>
                                      </div>
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
                                    </form>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <img
                                alt="Product image"
                                className="aspect-square w-10 rounded-md object-cover"
                                height="40"
                                src="https://shop.dev.minko.aexol.work/assets/mainafter__preview.webp?preset=small"
                                width="40"
                              />
                              <span className="font-semibold">T-Shirt</span>
                            </div>
                          </TableCell>
                          <TableCell>GGPC-001</TableCell>
                          <TableCell>2</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <img
                                alt="Product image"
                                className="aspect-square w-10 rounded-md object-cover"
                                height="40"
                                src="https://shop.dev.minko.aexol.work/assets/mainafter__preview.webp?preset=small"
                                width="40"
                              />
                              <span className="font-semibold">Hoodie</span>
                            </div>
                          </TableCell>
                          <TableCell>GGPC-002</TableCell>
                          <TableCell>4</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tax summary</CardTitle>
                </CardHeader>
              </Card>
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
              <CustomerSelectCard />
              <AddressCard type="billing" />
              <AddressCard type="shipping" />
              <Card>
                <CardHeader>
                  <CardTitle>Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <Label>ID: 1</Label>
                    <Label>Create date: 2021-09-01</Label>
                    <Label>Update date: 2021-09-01</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 md:hidden">
            <Button variant="outline" size="sm">
              Discard
            </Button>
            <Button size="sm">Complete draft order</Button>
          </div>
        </div>
      </div>
    </main>
  );
};
