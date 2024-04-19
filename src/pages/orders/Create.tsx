import { adminApiMutation, adminApiQuery } from '@/common/client';
import { CustomFieldConfigSelector, CustomFieldConfigType } from '@/graphql/base';
import { useGFFLP } from '@/lists/useGflp';
import React, { PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
  AutoCompleteSearchInput,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components';
import { ChevronLeft, PencilIcon, TrashIcon } from 'lucide-react';

import { CustomerSelectCard } from './_components/CustomerSelectCard';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AddressCard } from './_components/AddressCard';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DraftOrderType,
  EligibleShippingMethodsType,
  SearchProductVariantType,
  draftOrderSelector,
  eligibleShippingMethodsSelector,
  removeOrderItemsResultSelector,
  updatedDraftOrderSelector,
} from '@/graphql/draft_order';
import { ResolverInputTypes } from '@/zeus';
import { ShippingMethod } from './_components/ShippingMethod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
  let className = '';
  switch (state) {
    case 'Draft':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'AddingItems':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'ArrangingPayment':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'PaymentAuthorized':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'PaymentSettled':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'Cancelled':
      className = 'bg-destructive text-primary-background';
      break;
    case 'Fulfilled':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'PartiallyFulfilled':
      className = 'bg-primary-foreground text-primary-background';
      break;
    default:
      className = 'bg-primary-foreground text-primary-background';
  }

  switch (state) {
    case 'AddingItems':
      return <Badge className={className}>Adding items</Badge>;
    case 'ArrangingPayment':
      return <Badge className={className}>Arranging payment</Badge>;
    case 'PaymentAuthorized':
      return <Badge className={className}>Payment authorized</Badge>;
    case 'PaymentSettled':
      return <Badge className={className}>Payment settled</Badge>;
    case 'Cancelled':
      return (
        <Badge className={className} variant="destructive">
          Cancelled
        </Badge>
      );
    case 'Fulfilled':
      return <Badge className={className}>Fulfilled</Badge>;
    case 'PartiallyFulfilled':
      return <Badge className={className}>Partially fulfilled</Badge>;
    default:
      return <Badge className={className}>{state}</Badge>;
  }
};

export const OrderCreatePage = () => {
  const { t } = useTranslation('orders');
  const { id } = useParams();
  const { state, setField } = useGFFLP('AddItemToDraftOrderInput', 'customFields')({});
  const [eligibleShippingMethodsType, setEligibleShippingMethodsType] = useState<EligibleShippingMethodsType[]>([]);
  const [draftOrder, setDraftOrder] = useState<DraftOrderType | null>();

  const [open, setOpen] = useState(false);

  const [variantToAdd, setVariantToAdd] = useState<SearchProductVariantType | undefined>(undefined);
  const [addQuantity, setAddQuantity] = useState(1);
  const [customFields, setCustomFields] = useState<CustomFieldConfigType[]>([]);

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

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      const { order } = await adminApiQuery()({ order: [{ id }, draftOrderSelector] });
      setDraftOrder(order);
    };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToOrder = async (productVariantId: string, quantity: number, customFields: Record<string, unknown>) => {
    const { addItemToDraftOrder } = await adminApiMutation()({
      addItemToDraftOrder: [
        { input: { productVariantId, quantity, customFields }, orderId: id! },
        updatedDraftOrderSelector,
      ],
    });
    if (addItemToDraftOrder.__typename === 'Order' || addItemToDraftOrder.__typename === 'InsufficientStockError') {
      if (addItemToDraftOrder.__typename === 'Order') setDraftOrder(addItemToDraftOrder);
      else setDraftOrder(addItemToDraftOrder.order);
      setVariantToAdd(undefined);
      setOpen(false);
      setAddQuantity(1);
    }
  };

  const removeLineItem = async (orderLineId: string) => {
    const { removeDraftOrderLine } = await adminApiMutation()({
      removeDraftOrderLine: [{ orderId: id!, orderLineId }, removeOrderItemsResultSelector],
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

  const openAddVariantDialog = (variant: SearchProductVariantType) => {
    setOpen(true);
    setVariantToAdd(variant);
    setAddQuantity(1);
  };

  const closeAddVariantDialog = () => {
    setOpen(false);
    setVariantToAdd(undefined);
    setAddQuantity(1);
  };

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
    else toast(`Error: ${transitionOrderToState?.message}`, { position: 'top-center' });
  };

  const isOrderValid = useMemo(() => {
    const isVariantValid = draftOrder?.lines.every((line) => line.productVariant);
    const isCustomerValid = draftOrder?.customer?.id;
    const isBillingAddressValid = draftOrder?.billingAddress?.streetLine1;
    const isShippingAddressValid = draftOrder?.shippingAddress?.streetLine1;
    const isShippingMethodValid = draftOrder?.shippingLines?.length;
    return {
      valid:
        isVariantValid && isCustomerValid && isBillingAddressValid && isShippingAddressValid && isShippingMethodValid,
      isVariantValid,
      isCustomerValid,
      isBillingAddressValid,
      isShippingAddressValid,
      isShippingMethodValid,
    };
  }, [draftOrder]);

  return (
    <main>
      <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto grid w-full max-w-[1200px] flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                toast(t('create.leaveToastMessage'), {
                  position: 'top-center',
                  action: {
                    label: t('create.leaveToastButton'),
                    onClick: () => navigate('/orders'),
                  },
                });
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{t('create.back')}</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              {t('create.draftOrder')}
            </h1>
            <OrderStateBadge state={draftOrder?.state} />
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast(t('create.leaveToastMessage'), {
                    position: 'top-center',
                    action: {
                      label: t('create.leaveToastButton'),
                      onClick: () => navigate('/orders'),
                    },
                  });
                }}
              >
                {t('create.discardButton')}
              </Button>
              <Button size="sm" onClick={onSubmit} disabled={!isOrderValid.valid}>
                {t('create.completeOrderButton')}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
              <Card x-chunk="dashboard-07-chunk-0">
                <CardHeader>
                  <CardTitle> {t('create.addTitle')}</CardTitle>
                  <CardDescription> {t('create.addHeader')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <Label htmlFor="product">{t('create.searchPlaceholder')}</Label>
                    <AutoCompleteSearchInput onSelectItem={(i) => openAddVariantDialog(i)} />
                    <Dialog open={open} onOpenChange={(e) => (!e ? closeAddVariantDialog() : setOpen(true))}>
                      <DialogContent className="h-[90vh] max-w-[90vw]">
                        {variantToAdd ? (
                          <form
                            className="w-full"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              await addToOrder(variantToAdd.id, 1, {});
                            }}
                          >
                            <div className="flex w-full flex-col items-center gap-2">
                              <div className="flex w-full">
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
                            <div className="text-primary-background flex w-full flex-col gap-4 rounded-lg bg-primary-foreground p-4">
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
                            <div className="float-end flex flex-row justify-end gap-4">
                              <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                  {t('create.cancel')}
                                </Button>
                              </DialogClose>
                              <Button type="submit">{t('create.add')}</Button>
                            </div>
                          </form>
                        ) : (
                          <div>Something went wrong</div>
                        )}
                      </DialogContent>
                    </Dialog>

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
                              <DropdownMenu>
                                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>
                                    <Button size="sm" variant="ghost" onClick={() => removeLineItem(line.id)}>
                                      <TrashIcon className="h-4 w-4" />
                                      Remove
                                    </Button>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Button size="sm" variant="ghost" onClick={() => console.log('Edit')}>
                                      <PencilIcon className="h-4 w-4" />
                                      Edit
                                    </Button>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </LineItem>
                          ))
                        ) : (
                          <TableCell colSpan={4}>
                            <div className="mt-4 flex items-center justify-center">
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
              <CustomerSelectCard
                customer={draftOrder?.customer}
                handleCustomerEvent={handleCustomerEvent}
                valid={!!isOrderValid.isCustomerValid}
              />
              <AddressCard
                type="billing"
                defaultValue={{
                  streetLine1: '',
                  ...draftOrder?.billingAddress,
                }}
                customerAddresses={draftOrder?.customer?.addresses}
                valid={!!isOrderValid.isBillingAddressValid}
              />
              <AddressCard
                type="shipping"
                defaultValue={{
                  streetLine1: '',
                  ...draftOrder?.shippingAddress,
                }}
                customerAddresses={draftOrder?.customer?.addresses}
                valid={!!isOrderValid.isShippingAddressValid && !!isOrderValid.isBillingAddressValid}
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
      {children}
    </TableRow>
  );
};
