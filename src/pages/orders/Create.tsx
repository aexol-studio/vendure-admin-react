import { adminApiMutation, adminApiQuery } from '@/common/client';
import { CustomFieldConfigSelector, CustomFieldConfigType } from '@/graphql/base';
import { useGFFLP } from '@/lists/useGflp';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { registerCustomFieldComponent, generateCustomFields } from './logic';
import { DefaultProps } from './DefaultInputs/types';
import {
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  ProductVariantSearch,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Input,
  Checkbox,
  Textarea,
} from '@/components';
import { Badge, ChevronLeft, Grip, Trash } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CustomerSelectCard } from './_components/CustomerSelectCard';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddressCard } from './_components/AddressCard';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CreateAddressBaseType,
  DraftOrderType,
  PaymentMethodsType,
  EligibleShippingMethodsType,
  SearchProductVariantType,
  draftOrderSelector,
  eligibleShippingMethodsSelector,
  removeOrderItemsResultSelector,
  updatedDraftOrderSelector,
  paymentMethodsSelector,
  configurableOperationDefinitionSelector,
  ConfigurableOperationDefinitionType,
} from '@/graphql/draft_order';
import { ResolverInputTypes, SortOrder } from '@/zeus';
import { ShippingMethod } from './_components/ShippingMethod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { FulfillmentModal } from './_components/FulfillmentModal';
import { LineItem } from './_components/LineItem';
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from '@/components/ui/timeline';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Price } from '@/components/Price';
import { OrderStateBadge } from '@/pages/orders/_components';

declare global {
  interface Window {
    __ADMIN_UI_CONFIG__: {
      components: { where: string; name: string; componentPath?: string }[];
    };
  }
}

const registerComponents: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<DefaultProps<any>>;
  where: string;
}[] = [];

const TAKE = 100;
const getAllPaginatedCountries = async () => {
  let countries: { code: string; name: string }[] = [];
  let totalItems = 0;
  let skip = 0;
  do {
    const {
      countries: { items, totalItems: total },
    } = await adminApiQuery()({
      countries: [{ options: { skip, take: TAKE } }, { items: { code: true, name: true }, totalItems: true }],
    });
    countries = [...countries, ...items];
    totalItems = total;
    skip += TAKE;
  } while (countries.length < totalItems);
  return { countries };
};

const getAllHistory = async (id: string) => {
  let history: {
    id: string;
    administrator?: { id: string; firstName: string; lastName: string };
    isPublic: boolean;
    type: string;
    data: any;
  }[] = [];
  let totalItems = 0;
  let skip = 0;
  do {
    const { order } = await adminApiQuery()({
      order: [
        { id },
        {
          history: [
            { options: { skip, take: TAKE, sort: { createdAt: SortOrder.DESC } } },
            {
              items: {
                id: true,
                administrator: { id: true, firstName: true, lastName: true },
                isPublic: true,
                type: true,
                data: true,
              },
              totalItems: true,
            },
          ],
        },
      ],
    });
    history = [...history, ...(order?.history.items || [])];
    totalItems = order?.history.totalItems || 0;
    skip += TAKE;
  } while (history.length < totalItems);
  return { history };
};

const getAllPaymentMethods = async () => {
  let paymentMethods: PaymentMethodsType[] = [];
  let totalItems = 0;
  let skip = 0;
  do {
    const {
      paymentMethods: { items, totalItems: total },
    } = await adminApiQuery()({
      paymentMethods: [
        { options: { skip, take: TAKE, filter: { enabled: { eq: true } } } },
        { items: paymentMethodsSelector, totalItems: true },
      ],
    });
    paymentMethods = [...paymentMethods, ...items];
    totalItems = total;
    skip += TAKE;
  } while (paymentMethods.length < totalItems);
  return { paymentMethods };
};

const getFulfillmentHandlers = async () => {
  const { fulfillmentHandlers } = await adminApiQuery()({
    fulfillmentHandlers: configurableOperationDefinitionSelector,
  });
  return { fulfillmentHandlers };
};

export const OrderCreatePage = () => {
  const { t } = useTranslation('orders');
  const { id } = useParams();
  const { state, setField } = useGFFLP('AddItemToDraftOrderInput', 'customFields')({});
  const [eligibleShippingMethodsType, setEligibleShippingMethodsType] = useState<EligibleShippingMethodsType[]>([]);
  const [paymentMethodsType, setPaymentMethodsType] = useState<PaymentMethodsType[]>([]);
  const [draftOrder, setDraftOrder] = useState<DraftOrderType | undefined>();

  const [open, setOpen] = useState(false);

  const [variantToAdd, setVariantToAdd] = useState<SearchProductVariantType | undefined>(undefined);
  const [customFields, setCustomFields] = useState<CustomFieldConfigType[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [orderHistory, setOrderHistory] = useState<
    {
      id: string;
      administrator?: { id: string; firstName: string; lastName: string };
      isPublic: boolean;
      type: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: any;
    }[]
  >([]);
  const [fulfillmentHandlers, setFulfillmentHandlers] = useState<ConfigurableOperationDefinitionType[]>([]);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { __ADMIN_UI_CONFIG__ } = window;
      __ADMIN_UI_CONFIG__.components.map((c) => {
        if (!c.componentPath) return;
        if (c.where !== 'order-create') return;
        import(c.componentPath).then((m) => {
          registerCustomFieldComponent({
            registerComponents,
            name: c.name,
            component: m.CustomComponent,
            where: c.where,
          });
        });
      });
      const [{ globalSettings }, { order }, { eligibleShippingMethodsForDraftOrder }] = await Promise.all([
        adminApiQuery()({
          globalSettings: { serverConfig: { customFieldConfig: { OrderLine: CustomFieldConfigSelector } } },
        }),
        adminApiQuery()({ order: [{ id }, draftOrderSelector] }),
        adminApiQuery()({ eligibleShippingMethodsForDraftOrder: [{ orderId: id }, eligibleShippingMethodsSelector] }),
      ]);
      const [{ countries }, { paymentMethods }, { history }, { fulfillmentHandlers }] = await Promise.all([
        getAllPaginatedCountries(),
        getAllPaymentMethods(),
        getAllHistory(id),
        getFulfillmentHandlers(),
      ]);

      setDraftOrder(order);
      setCustomFields(globalSettings.serverConfig.customFieldConfig.OrderLine);
      setCountries(countries);
      setOrderHistory(history);
      setEligibleShippingMethodsType(eligibleShippingMethodsForDraftOrder);
      setPaymentMethodsType(paymentMethods);
      setFulfillmentHandlers(fulfillmentHandlers);
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
    };
    fetch();
  }, []);

  const selectShippingMethod = async (shippingMethodId: string) => {
    const orderId = draftOrder?.id;
    if (!orderId) return;
    const { setDraftOrderShippingMethod } = await adminApiMutation()({
      setDraftOrderShippingMethod: [
        { orderId, shippingMethodId },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on IneligibleShippingMethodError': { message: true, errorCode: true },
          '...on NoActiveOrderError': { message: true, errorCode: true },
          '...on OrderModificationError': { message: true, errorCode: true },
        },
      ],
    });
    if (setDraftOrderShippingMethod.__typename === 'Order') setDraftOrder(setDraftOrderShippingMethod);
  };

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
    if (id) {
      const { setCustomerForDraftOrder } = await adminApiMutation()({
        setCustomerForDraftOrder: [
          { orderId: id, customerId, input },
          {
            __typename: true,
            '...on Order': draftOrderSelector,
            '...on EmailAddressConflictError': { errorCode: true, message: true },
          },
        ],
      });
      if (setCustomerForDraftOrder.__typename === 'Order') setDraftOrder(setCustomerForDraftOrder);
    }
  };
  const navigate = useNavigate();

  const openAddVariantDialog = (variant: SearchProductVariantType) => {
    setOpen(true);
    setVariantToAdd(variant);
  };

  const closeAddVariantDialog = () => {
    setOpen(false);
    setVariantToAdd(undefined);
  };

  const onSubmit = async () => {
    const isValid =
      draftOrder?.shippingAddress &&
      draftOrder?.billingAddress &&
      draftOrder?.shippingLines.length &&
      draftOrder?.customer;
    if (!isValid) {
      toast.error('Please fill all required fields', { position: 'top-center', closeButton: true });
      return;
    }

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
    if (transitionOrderToState?.__typename === 'Order') {
      setDraftOrder(transitionOrderToState);
      const data = await getAllHistory(id);
      setOrderHistory(data.history);
    } else {
      const errorMessage = `
        ${transitionOrderToState?.message || 'Something went wrong'}
        ${transitionOrderToState?.transitionError || ''}
      `;
      toast(errorMessage, { position: 'top-center' });
    }
  };

  const handleMethodChange = async ({
    address,
    isShipping,
    createForCustomer,
  }: {
    address: CreateAddressBaseType;
    isShipping: boolean;
    createForCustomer: boolean;
  }) => {
    const orderId = draftOrder?.id;
    if (orderId && address) {
      if (isShipping) {
        await adminApiMutation()({
          setDraftOrderShippingAddress: [{ orderId, input: address }, draftOrderSelector],
        })
          .then((e) => {
            setDraftOrder(e.setDraftOrderShippingAddress);
            toast(
              t(
                createForCustomer
                  ? 'selectAddress.addressSuccessCreateToast'
                  : 'selectAddress.addressSuccessSelectToast',
              ),
            );
          })
          .catch(() => {
            toast.error(
              t(
                createForCustomer ? 'selectAddress.addressFailedCreateToast' : 'selectAddress.addressFailedSelectToast',
              ),
            );
          });
      } else {
        await adminApiMutation()({
          setDraftOrderBillingAddress: [{ orderId, input: address }, draftOrderSelector],
        })
          .then((e) => {
            setDraftOrder(e.setDraftOrderBillingAddress);
            toast(
              t(
                createForCustomer
                  ? 'selectAddress.addressSuccessCreateToast'
                  : 'selectAddress.addressSuccessSelectToast',
              ),
            );
          })
          .catch(() => {
            toast.error(
              t(
                createForCustomer ? 'selectAddress.addressFailedCreateToast' : 'selectAddress.addressFailedSelectToast',
              ),
            );
          });
      }
      if (createForCustomer && draftOrder?.customer?.id) {
        await adminApiMutation()({
          createCustomerAddress: [{ customerId: draftOrder.customer.id, input: address }, { streetLine1: true }],
        })
          .then((e) => toast.success(t('selectAddress.newAddress', { address: e.createCustomerAddress.streetLine1 })))
          .catch(() => toast.error(t('selectAddress.addressAddFailed')));
      }
    }
  };

  const addPaymentToOrder = async (input: ResolverInputTypes['ManualPaymentInput']) => {
    if (!id) return;
    const { addManualPaymentToOrder } = await adminApiMutation()({
      addManualPaymentToOrder: [
        { input },
        {
          __typename: true,
          '...on Order': draftOrderSelector,
          '...on ManualPaymentStateError': { message: true, errorCode: true },
        },
      ],
    });
    if (addManualPaymentToOrder.__typename === 'Order') {
      setDraftOrder(addManualPaymentToOrder);
      const data = await getAllHistory(id);
      setOrderHistory(data.history);
    } else {
      const errorMessage = `
        ${addManualPaymentToOrder?.message || 'Something went wrong'}
      `;
      toast.error(errorMessage, { position: 'top-center' });
    }
  };

  const fulfillOrder = async (input: ResolverInputTypes['FulfillOrderInput']) => {
    if (!id) return;
    const { addFulfillmentToOrder } = await adminApiMutation()({
      addFulfillmentToOrder: [
        { input },
        {
          __typename: true,
          '...on Fulfillment': {
            id: true,
          },
          '...on CreateFulfillmentError': {
            message: true,
            errorCode: true,
            fulfillmentHandlerError: true,
          },
          '...on EmptyOrderLineSelectionError': {
            message: true,
            errorCode: true,
          },
          '...on FulfillmentStateTransitionError': {
            errorCode: true,
            fromState: true,
            message: true,
            toState: true,
            transitionError: true,
          },
          '...on InsufficientStockOnHandError': {
            errorCode: true,
            message: true,
            productVariantId: true,
            productVariantName: true,
            stockOnHand: true,
          },
          '...on InvalidFulfillmentHandlerError': {
            message: true,
            errorCode: true,
          },
          '...on ItemsAlreadyFulfilledError': {
            message: true,
            errorCode: true,
          },
        },
      ],
    });
    if (addFulfillmentToOrder.__typename === 'Fulfillment') {
      const { transitionFulfillmentToState } = await adminApiMutation()({
        transitionFulfillmentToState: [
          { id: addFulfillmentToOrder.id, state: 'Shipped' },
          {
            __typename: true,
            '...on Fulfillment': {
              id: true,
            },
            '...on FulfillmentStateTransitionError': {
              errorCode: true,
              fromState: true,
              message: true,
              toState: true,
              transitionError: true,
            },
          },
        ],
      });
      if (transitionFulfillmentToState.__typename === 'Fulfillment') {
        const { order } = await adminApiQuery()({ order: [{ id }, draftOrderSelector] });
        setDraftOrder(order);
        const data = await getAllHistory(id);
        setOrderHistory(data.history);
        toast.success('Fulfillment added successfully', { position: 'top-center' });
        return;
      } else {
        const errorMessage = `
          ${transitionFulfillmentToState?.message || 'Something went wrong'}
        `;
        toast.error(errorMessage, { position: 'top-center' });
      }
    } else {
      const errorMessage = `
        ${addFulfillmentToOrder?.message || 'Something went wrong'}
      `;
      toast.error(errorMessage, { position: 'top-center' });
    }
  };

  const markAsDelivered = async (fulfillmentId: string) => {
    if (!id) return;
    const { transitionFulfillmentToState } = await adminApiMutation()({
      transitionFulfillmentToState: [
        { id: fulfillmentId, state: 'Delivered' },
        {
          __typename: true,
          '...on Fulfillment': {
            id: true,
          },
          '...on FulfillmentStateTransitionError': {
            errorCode: true,
            fromState: true,
            message: true,
            toState: true,
            transitionError: true,
          },
        },
      ],
    });
    if (transitionFulfillmentToState.__typename === 'Fulfillment') {
      const { order } = await adminApiQuery()({ order: [{ id }, draftOrderSelector] });
      setDraftOrder(order);
      const data = await getAllHistory(id);
      setOrderHistory(data.history);
      toast.success('Fulfillment marked as delivered', { position: 'top-center' });
    } else {
      const errorMessage = `
        ${transitionFulfillmentToState?.message || 'Something went wrong'}
      `;
      toast.error(errorMessage, { position: 'top-center' });
    }
  };

  const addMessageToOrder = async (input: ResolverInputTypes['AddNoteToOrderInput']) => {
    const { addNoteToOrder } = await adminApiMutation()({
      addNoteToOrder: [{ input }, { id: true }],
    });

    if (addNoteToOrder.id) {
      const { history } = await getAllHistory(addNoteToOrder.id);
      setOrderHistory(history);
    } else toast.error('Something went wrong while adding note to order', { position: 'top-center' });
  };

  const deleteMessageFromOrder = async (id: string) => {
    const { deleteOrderNote } = await adminApiMutation()({
      deleteOrderNote: [{ id }, { message: true, result: true }],
    });

    if (deleteOrderNote.result) {
      const { history } = await getAllHistory(draftOrder?.id || '');
      setOrderHistory(history);
    } else toast.error('Something went wrong while deleting note from order', { position: 'top-center' });
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
                if (draftOrder?.state === 'Draft') {
                  toast.error(t('create.leaveToastMessage'), {
                    position: 'top-center',
                    action: {
                      label: t('create.leaveToastButton'),
                      onClick: () => navigate('/orders'),
                    },
                  });
                } else {
                  navigate('/orders');
                }
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{t('create.back')}</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              {draftOrder?.state === 'Draft' ? t('create.draftOrder') : `#${draftOrder?.code}`}
            </h1>
            <OrderStateBadge state={draftOrder?.state} />
            {draftOrder?.state === 'Draft' ? (
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
                <Button size="sm" onClick={onSubmit}>
                  {t('create.completeOrderButton')}
                </Button>
              </div>
            ) : draftOrder?.state === 'PaymentSettled' ? (
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <FulfillmentModal
                  draftOrder={draftOrder}
                  fulfillmentHandlers={fulfillmentHandlers}
                  onSubmitted={fulfillOrder}
                />
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                {draftOrder?.state !== 'Shipped' &&
                draftOrder?.state !== 'PartiallyShipped' &&
                draftOrder?.state !== 'Delivered' &&
                draftOrder?.state !== 'PartiallyDelivered' &&
                draftOrder?.state !== 'Cancelled' &&
                draftOrder?.state !== 'Fulfilled' &&
                draftOrder?.state !== 'PartiallyFulfilled' ? (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm">
                          Add payment to order (<Price price={draftOrder?.totalWithTax} />)
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add payment to order</DialogTitle>
                          <DialogDescription>Please select a payment method to complete the order.</DialogDescription>
                        </DialogHeader>
                        <form
                          className="flex w-full flex-col gap-4"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!id) return;
                            const form = e.currentTarget;
                            const formData = new FormData(form);
                            const paymentMethod = formData.get('paymentMethod') as string;
                            const transaction = formData.get('transaction') as string;
                            await addPaymentToOrder({
                              orderId: id,
                              method: paymentMethod,
                              transactionId: transaction,
                              metadata: {},
                            });
                          }}
                        >
                          <Select name="paymentMethod">
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentMethodsType.map((method) => (
                                <SelectItem key={method.id} value={method.id} onSelect={() => {}}>
                                  {method.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input name="transaction" type="number" label="Transaction ID" />
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button type="submit">Add payment</Button>
                            </DialogClose>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={draftOrder?.state !== 'PaymentAuthorized'}
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
                      Zrealizuj zamówienie
                    </Button>
                  </>
                ) : null}
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Grip className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-8 w-56">
                {draftOrder?.state === 'PaymentSettled' ? (
                  <DropdownMenuItem>
                    <Button variant="ghost" className="w-full justify-start">
                      Modyfikuj zamówienie
                    </Button>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem>
                  <Button variant="ghost" className="w-full justify-start">
                    Anuluj zamówienie
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Button variant="ghost" className="w-full justify-start">
                    Manualnie zmień status
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle> {t('create.addTitle')}</CardTitle>
                  <CardDescription> {t('create.addHeader')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <Label htmlFor="product">{t('create.searchPlaceholder')}</Label>
                    <ProductVariantSearch onSelectItem={(i) => openAddVariantDialog(i)} />
                    <Dialog open={open} onOpenChange={(e) => (!e ? closeAddVariantDialog() : setOpen(true))}>
                      <DialogContent className="h-[90vh] max-w-[90vw]">
                        {variantToAdd ? (
                          <form
                            className="flex h-full w-full flex-col"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              await addToOrder(variantToAdd.id, 1, {});
                            }}
                          >
                            <div className="flex w-full flex-col items-center gap-2">
                              <div className="flex w-full">
                                <LineItem noBorder noHover variant={{ ...variantToAdd, quantity: 1 }}>
                                  <Button type="submit" size="sm" variant="outline">
                                    Add item
                                  </Button>
                                </LineItem>
                              </div>
                            </div>
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
                        <TableRow noHover>
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setVariantToAdd(line.productVariant);
                                  setOpen(true);
                                }}
                              >
                                Edit
                              </Button>
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
                  <CardDescription>Order tax summary</CardDescription>
                  <Table>
                    <TableHeader>
                      <TableRow noHover>
                        <TableHead>Description</TableHead>
                        <TableHead>Tax rate</TableHead>
                        <TableHead>Tax base</TableHead>
                        <TableHead>Tax total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draftOrder?.taxSummary.map(({ description, taxRate, taxBase, taxTotal }) => (
                        <TableRow key={description} noHover>
                          <TableCell className="capitalize">{description}</TableCell>
                          <TableCell>{taxRate}%</TableCell>
                          <TableCell>
                            <Price price={taxBase} />
                          </TableCell>
                          <TableCell>
                            <Price price={taxTotal} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardHeader>
              </Card>
              {orderHistory.length ? (
                <Card>
                  <CardHeader>
                    <CardTitle>History</CardTitle>
                    <CardDescription>Order history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="flex flex-col gap-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const formData = new FormData(form);
                        const comment = formData.get('comment') as string;
                        const isPublic = formData.get('isPublic') === 'on';
                        await addMessageToOrder({ id: id!, isPublic, note: comment });
                      }}
                    >
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="comment">Add comment</Label>
                        <Textarea id="comment" name="comment" className="h-24 w-full resize-none rounded-md p-2" />
                        <div className="flex items-center gap-2">
                          <Checkbox id="isPublic" name="isPublic" />
                          <Label htmlFor="isPublic">
                            Visible to customer
                            <span className="ml-2 text-gray-500">(optional)</span>
                          </Label>
                        </div>
                      </div>
                      <div className="flex flex-row justify-end gap-4">
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                        <Button size="sm">Add comment</Button>
                      </div>
                    </form>
                    <div>
                      <Timeline positions="left" className="mt-4 w-full">
                        {orderHistory.map((history) => {
                          return (
                            <TimelineItem key={history.id} status="done" className="w-full">
                              <TimelineHeading side="right" className="w-full">
                                <div className="flex">
                                  <div className="flex w-full items-center justify-between">
                                    <p>
                                      {history.administrator?.firstName} {history.administrator?.lastName}&nbsp;
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-2">
                                        {Object.entries(history.data).map(([key, value]) => {
                                          if (key === 'from' || key === 'to') {
                                            return (
                                              <div key={key} className="flex items-center gap-1">
                                                <p>{key}:</p>
                                                <OrderStateBadge state={value as string} />
                                              </div>
                                            );
                                          }
                                          return null;
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TimelineHeading>
                              <TimelineDot status="done" />
                              <TimelineLine done />
                              <TimelineContent side="right" className="relative">
                                <div className="flex flex-col">
                                  <div>{history.type}</div>
                                  <div>{history.isPublic ? 'Visible to customer' : 'Not visible to customer'}</div>
                                  {!history.isPublic ? (
                                    <div>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button size="sm" variant="ghost">
                                            <Trash className="h-4 w-4" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-42">
                                          <div className="flex flex-col gap-2">
                                            <p>Are you sure?</p>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => deleteMessageFromOrder(history.id)}
                                            >
                                              Delete
                                            </Button>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  ) : null}
                                  {'paymentId' in history.data ? (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          Show payment
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <div className="flex flex-col gap-2">
                                          <Label>Payment ID: {history.data.paymentId}</Label>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  ) : null}
                                  {'fulfillmentId' in history.data ? (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          Show fulfillment
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <div className="flex flex-col gap-2">
                                          <Label>Fulfillment ID: {history.data.fulfillmentId}</Label>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  ) : null}
                                </div>
                              </TimelineContent>
                            </TimelineItem>
                          );
                        })}
                      </Timeline>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1">
                    <div>
                      <Label>ID: {draftOrder?.id}</Label>
                    </div>
                    <div>
                      <Label>Create date: {draftOrder?.createdAt}</Label>
                    </div>
                    <div>
                      <Label>Update date: {draftOrder?.updatedAt}</Label>
                    </div>
                    <div>
                      <Label>Order code: {draftOrder?.code}</Label>
                    </div>
                    <div>
                      <Label>State: {draftOrder?.state}</Label>
                    </div>
                    <AnimatePresence>
                      {draftOrder?.total ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                        >
                          <Label>Total: </Label>
                          <Label>
                            <Price price={draftOrder?.totalWithTax || 0} />
                          </Label>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
              <AnimatePresence>
                {draftOrder?.fulfillments && draftOrder.fulfillments.length ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  >
                    <Card className="border-primary">
                      <CardHeader>
                        <CardTitle>Realization</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow noHover>
                              <TableHead>Method</TableHead>
                              <TableHead>State</TableHead>
                              <TableHead>Tracking code</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {draftOrder.fulfillments.map((fulfillment) => (
                              <React.Fragment key={fulfillment.id}>
                                <TableRow>
                                  <TableCell>{fulfillment.method}</TableCell>
                                  <TableCell>{fulfillment.state}</TableCell>
                                  <TableCell>{fulfillment.trackingCode}</TableCell>
                                  {fulfillment.state === 'Shipped' ? (
                                    <Button size="sm" variant="outline" onClick={() => markAsDelivered(fulfillment.id)}>
                                      Mark as delivered
                                    </Button>
                                  ) : null}
                                </TableRow>
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <CustomerSelectCard
                isDraft={draftOrder?.state === 'Draft'}
                customer={draftOrder?.customer}
                handleCustomerEvent={handleCustomerEvent}
              />
              <AddressCard
                isDraft={draftOrder?.state === 'Draft'}
                type="billing"
                onSubmitted={handleMethodChange}
                orderId={draftOrder?.id}
                countries={countries}
                defaultValue={draftOrder?.billingAddress}
                customerAddresses={draftOrder?.customer?.addresses}
              />
              <AddressCard
                isDraft={draftOrder?.state === 'Draft'}
                type="shipping"
                onSubmitted={handleMethodChange}
                orderId={draftOrder?.id}
                countries={countries}
                defaultValue={draftOrder?.shippingAddress}
                customerAddresses={draftOrder?.customer?.addresses}
              />
              <ShippingMethod
                order={draftOrder}
                shippingMethods={eligibleShippingMethodsType}
                shippingLines={draftOrder?.shippingLines}
                onSelectShippingMethod={selectShippingMethod}
              />
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
