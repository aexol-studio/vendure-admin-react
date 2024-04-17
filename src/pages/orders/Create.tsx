import { adminApiMutation, adminApiQuery } from '@/common/client';
import { CustomFieldConfigSelector, CustomFieldConfigType } from '@/graphql/base';
import { useGFFLP } from '@/lists/useGflp';
import React, { PropsWithChildren } from 'react';
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
  CardHeader,
  CardTitle,
  Label,
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
} from '@/components';
import { ChevronLeft } from 'lucide-react';

import { CustomerSelectCard } from './_components/CustomerSelectCard';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AddressCard } from './_components/AddressCard';
import { AutoCompleteInput } from '@/components/AutoCompleteInput';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DraftOrderType,
  EligibleShippingMethodsType,
  draftOrderSelector,
  eligibleShippingMethodsSelector,
} from '@/graphql/draft_order';
import { LogicalOperator, ResolverInputTypes } from '@/zeus';
import { ShippingMethod } from './_components/ShippingMethod';
import { toast } from 'sonner';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@radix-ui/react-hover-card';

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

type VariantWithQuantity = DraftOrderType['lines'][number]['productVariant'] & { quantity?: number };

const OrderStateBadge: React.FC<{ state?: DraftOrderType['state'] }> = ({ state }) => {
  switch (state) {
    case 'AddingItems':
      return <Badge>Adding items</Badge>;
    case 'ArrangingPayment':
      return <Badge>Arranging payment</Badge>;
    case 'PaymentAuthorized':
      return <Badge>Payment authorized</Badge>;
    case 'PaymentSettled':
      return <Badge>Payment settled</Badge>;
    case 'Cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    case 'Fulfilled':
      return <Badge>Fulfilled</Badge>;
    case 'PartiallyFulfilled':
      return <Badge>Partially fulfilled</Badge>;
    default:
      return <Badge>{state}</Badge>;
  }
};

export const OrderCreatePage = () => {
  // const { t } = useTranslation('orders');
  const { id } = useParams();
  const [selectedTab, setSelectedTab] = useState('General');
  const [customFields, setCustomFields] = useState<CustomFieldConfigType[]>([]);
  const { state, setField } = useGFFLP('AddItemToDraftOrderInput', 'customFields')({});
  const [eligibleShippingMethodsType, setEligibleShippingMethodsType] = useState<EligibleShippingMethodsType[]>([]);

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
      const { eligibleShippingMethodsForDraftOrder } = await adminApiQuery()({
        eligibleShippingMethodsForDraftOrder: [{ orderId: id! }, eligibleShippingMethodsSelector],
      });
      setEligibleShippingMethodsType(eligibleShippingMethodsForDraftOrder);
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

  const [draftOrder, setDraftOrder] = useState<DraftOrderType | null>();
  const [searchData, setSearchData] = useState<any[]>([]);
  const [variantToAdd, setVariantToAdd] = useState<any | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { order } = await adminApiQuery()({ order: [{ id }, draftOrderSelector] });
      setDraftOrder(order);
    };
    fetch();
  }, []);

  const addToOrder = async (productVariantId: string, quantity: number, customFields: Record<string, unknown>) => {
    const { addItemToDraftOrder } = await adminApiMutation()({
      addItemToDraftOrder: [
        { input: { productVariantId, quantity, customFields }, orderId: id! },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on InsufficientStockError': {
            errorCode: true,
            message: true,
            order: draftOrderSelector,
            quantityAvailable: true,
          },
          '...on NegativeQuantityError': {
            errorCode: true,
            message: true,
          },
          '...on OrderLimitError': {
            errorCode: true,
            message: true,
            maxItems: true,
          },
          '...on OrderModificationError': {
            errorCode: true,
            message: true,
          },
        },
      ],
    });
    if (addItemToDraftOrder.__typename === 'Order' || addItemToDraftOrder.__typename === 'InsufficientStockError') {
      if (addItemToDraftOrder.__typename === 'Order') setDraftOrder(addItemToDraftOrder);
      else setDraftOrder(addItemToDraftOrder.order);
      setVariantToAdd(null);
    }
  };

  const removeLineItem = async (orderLineId: string) => {
    const { removeDraftOrderLine } = await adminApiMutation()({
      removeDraftOrderLine: [
        { orderId: id!, orderLineId },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on OrderModificationError': {
            errorCode: true,
            message: true,
          },
        },
      ],
    });
    if (removeDraftOrderLine.__typename === 'Order') setDraftOrder(removeDraftOrderLine);
  };

  const adjustLineItem = async (orderLineId: string, quantity: number) => {
    const { adjustDraftOrderLine } = await adminApiMutation()({
      adjustDraftOrderLine: [
        { orderId: id!, input: { orderLineId, quantity } },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on InsufficientStockError': {
            errorCode: true,
            message: true,
            order: draftOrderSelector,
            quantityAvailable: true,
          },
          '...on NegativeQuantityError': {
            errorCode: true,
            message: true,
          },
          '...on OrderLimitError': {
            errorCode: true,
            message: true,
            maxItems: true,
          },
          '...on OrderModificationError': {
            errorCode: true,
            message: true,
          },
        },
      ],
    });
    if (adjustDraftOrderLine.__typename === 'Order' || adjustDraftOrderLine.__typename === 'InsufficientStockError') {
      if (adjustDraftOrderLine.__typename === 'Order') setDraftOrder(adjustDraftOrderLine);
      else setDraftOrder(adjustDraftOrderLine.order);
    }
  };

  const handleCustomerEvent = async ({
    customerId,
    input,
  }: {
    customerId?: string;
    input?: ResolverInputTypes['CreateCustomerInput'];
  }) => {
    const { setCustomerForDraftOrder } = await adminApiMutation()({
      setCustomerForDraftOrder: [
        { orderId: id!, customerId, input },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on EmailAddressConflictError': { errorCode: true, message: true },
        },
      ],
    });
    if (setCustomerForDraftOrder.__typename === 'Order') setDraftOrder(setCustomerForDraftOrder);
  };
  const navigate = useNavigate();

  const onSubmit = async () => {
    const { transitionOrderToState } = await adminApiMutation()({
      transitionOrderToState: [
        { id: id!, state: 'ArrangingPayment' },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on OrderStateTransitionError': {
            errorCode: true,
            message: true,
            fromState: true,
            toState: true,
            transitionError: true,
          },
        },
      ],
    });
    if (transitionOrderToState?.__typename === 'Order') setDraftOrder(transitionOrderToState);
  };

  return (
    <main>
      <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="max-w-[1200px] w-full mx-auto grid flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                toast('Are you sure you want to leave this page?', {
                  position: 'top-center',
                  action: {
                    label: 'Leave',
                    onClick: () => navigate('/orders'),
                  },
                });
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              Draft order
            </h1>
            <OrderStateBadge state={draftOrder?.state} />
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast('Are you sure you want to leave this page?', {
                    position: 'top-center',
                    action: {
                      label: 'Leave',
                      onClick: () => navigate('/orders'),
                    },
                  });
                }}
              >
                Discard
              </Button>
              <Button size="sm" onClick={onSubmit}>
                Complete draft order
              </Button>
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
                    <Label htmlFor="product">Product</Label>
                    <AutoCompleteInput
                      route={async ({ filter }) => {
                        const data = await adminApiQuery()({
                          products: [
                            { options: { take: 10, filter, filterOperator: LogicalOperator.OR } },
                            { items: { id: true, name: true, assets: { preview: true } }, totalItems: true },
                          ],
                        });
                        return data.products.items.map((product) => ({
                          children: (
                            <div className="flex flex-1 flex-row justify-between w-full gap-4 items-center">
                              <div>{product.id}</div>
                              <div>{product.name}</div>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <img src={product.assets[0].preview} alt={product.name} className="h-20 w-20" />
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <img
                                    src={product.assets[0].preview}
                                    alt={product.name}
                                    className="h-80 w-80 object-contain"
                                  />
                                </HoverCardContent>
                              </HoverCard>
                            </div>
                          ),
                        }));
                      }}
                    />

                    <Card>
                      <CardContent className="p-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {variantToAdd ? (
                              <LineItem variant={variantToAdd}>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost">
                                      Add item
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[90vw] h-[90vh]">
                                    <form
                                      className="w-full"
                                      onSubmit={async (e) => {
                                        e.preventDefault();
                                        await addToOrder(variantToAdd.id, 1, {});
                                      }}
                                    >
                                      <div className="w-full flex flex-col items-center gap-2">
                                        <div className="w-full flex">
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
                                              <LineItem variant={{ ...variantToAdd, quantity: 1 }}>
                                                <Button type="submit" size="sm" variant="outline">
                                                  Add item
                                                </Button>
                                              </LineItem>
                                            </TableBody>
                                          </Table>
                                        </div>
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
                              </LineItem>
                            ) : (
                              <TableCell colSpan={3}>
                                <div className="flex items-center justify-center mt-4">
                                  <span>No product selected</span>
                                </div>
                              </TableCell>
                            )}
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
                        {draftOrder?.lines.length ? (
                          draftOrder.lines.map((line) => (
                            <LineItem
                              adjustLineItem={(quantity) => adjustLineItem(line.id, quantity)}
                              key={line.id}
                              variant={{ ...line.productVariant, quantity: line.quantity }}
                            >
                              <Button size="sm" variant="ghost" onClick={() => removeLineItem(line.id)}>
                                Remove
                              </Button>
                            </LineItem>
                          ))
                        ) : (
                          <TableCell colSpan={4}>
                            <div className="flex items-center justify-center mt-4">
                              <span>No items in draft order</span>
                            </div>
                          </TableCell>
                        )}
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
              <CustomerSelectCard customer={draftOrder?.customer} handleCustomerEvent={handleCustomerEvent} />
              <AddressCard
                type="billing"
                defaultValue={{
                  streetLine1: '',
                  ...draftOrder?.billingAddress,
                }}
                customerAddresses={draftOrder?.customer?.addresses}
              />
              <AddressCard
                type="shipping"
                defaultValue={{
                  streetLine1: '',
                  ...draftOrder?.shippingAddress,
                }}
                customerAddresses={draftOrder?.customer?.addresses}
              >
                <ShippingMethod
                  shippingMethods={eligibleShippingMethodsType}
                  selectedShippingMethod={draftOrder?.shippingLines[0]?.id || ''}
                  onChange={(value) => console.log(value)}
                />
              </AddressCard>
              <Card>
                <CardHeader>
                  <CardTitle>Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <Label>{draftOrder?.id}</Label>
                    <Label>Create date: {draftOrder?.createdAt}</Label>
                    <Label>Update date: {draftOrder?.updatedAt}</Label>
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

const LineItem: React.FC<
  PropsWithChildren<{ variant: VariantWithQuantity; adjustLineItem?: (quantity: number) => void }>
> = ({ children, variant, adjustLineItem }) => {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <img
            alt="Product image"
            className="aspect-square w-10 rounded-md object-cover"
            height="40"
            width="40"
            src={variant?.featuredAsset?.preview || variant?.product?.featuredAsset?.preview}
          />
          <span className="font-semibold">{variant?.product.name}</span>
        </div>
      </TableCell>
      <TableCell>{variant?.sku}</TableCell>
      {variant?.quantity ? (
        <TableCell>
          {adjustLineItem ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => adjustLineItem(variant.quantity ? variant.quantity + 1 : 1)}
              >
                +
              </Button>
              <span>{variant?.quantity}</span>
              <Button
                variant="ghost"
                type="button"
                onClick={() => adjustLineItem(variant.quantity ? variant.quantity - 1 : 1)}
              >
                -
              </Button>
            </div>
          ) : (
            variant?.quantity
          )}
        </TableCell>
      ) : null}
      <TableCell>{children}</TableCell>
    </TableRow>
  );
};
