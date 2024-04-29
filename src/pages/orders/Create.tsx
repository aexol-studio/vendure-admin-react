import { adminApiMutation, adminApiQuery } from '@/common/client';
import { useEffect, useMemo, useState } from 'react';
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
} from '@/components';
import { ChevronLeft, Grip } from 'lucide-react';
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
import { useNavigate, useParams } from 'react-router-dom';
import {
  CreateAddressBaseType,
  DraftOrderType,
  EligibleShippingMethodsType,
  SearchProductVariantType,
  draftOrderSelector,
  eligibleShippingMethodsSelector,
  removeOrderItemsResultSelector,
  updatedDraftOrderSelector,
  orderHistoryEntrySelector,
  OrderHistoryEntryType,
  addFulfillmentToOrderResultSelector,
} from '@/graphql/draft_order';
import { ResolverInputTypes, SortOrder } from '@/zeus';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  AddressCard,
  CustomerSelectCard,
  FulfillmentModal,
  LineItem,
  OrderStateBadge,
  ShippingMethod,
  RealizationCard,
  SummaryCard,
  OrderHistory,
  TaxSummary,
  PossibleOrderStates,
  ManualOrderChangeModal,
} from '@/pages/orders/_components';
import { useServer } from '@/state/server';
import { priceFormatter } from '@/utils';
import { CustomFieldConfigSelector, CustomFieldConfigType } from '@/graphql/base';
import { CustomFieldsComponent } from '@/custom_fields/CustomFieldsComponent';
import { useGFFLP } from '@/lists/useGflp';

const TAKE = 100;

const getAllOrderHistory = async (id: string) => {
  let history: OrderHistoryEntryType[] = [];
  let totalItems = 0;
  let skip = 0;
  do {
    const { order } = await adminApiQuery({
      order: [
        { id },
        {
          history: [
            { options: { skip, take: TAKE, sort: { createdAt: SortOrder.DESC } } },
            { items: orderHistoryEntrySelector, totalItems: true },
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

export const OrderCreatePage = () => {
  const { t } = useTranslation('orders');
  const { id } = useParams();
  const navigate = useNavigate();
  const paymentMethodsType = useServer((p) => p.paymentMethodsType);
  const serverConfig = useServer((p) => p.serverConfig);
  const [eligibleShippingMethodsType, setEligibleShippingMethodsType] = useState<EligibleShippingMethodsType[]>([]);
  const [draftOrder, setDraftOrder] = useState<DraftOrderType | undefined>();
  const [variantToAdd, setVariantToAdd] = useState<SearchProductVariantType | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntryType[]>([]);
  const [manualChange, setManualChange] = useState(false);

  const currentPossibilities = useMemo(() => {
    return serverConfig?.orderProcess?.find((state) => state.name === draftOrder?.state);
  }, [serverConfig, draftOrder]);

  const { state, setField } = useGFFLP('AddItemToDraftOrderInput', 'customFields')({});
  const [orderLineCustomFieldsConfig, setOrderLineCustomFieldsConfig] = useState<CustomFieldConfigType[]>();
  // useEffect(() => {
  // if (orderLineCustomFields) {
  //   Object.values(orderLineCustomFields).forEach((value) => {
  //     let init;
  //     if (value.list) {
  //       init = [];
  //     } else {
  //       switch (value.__typename) {
  //         case 'BooleanCustomFieldConfig':
  //           init = false;
  //           break;
  //         case 'FloatCustomFieldConfig':
  //         case 'IntCustomFieldConfig':
  //         case 'LocaleTextCustomFieldConfig':
  //         case 'StringCustomFieldConfig':
  //           init = '';
  //           break;
  //       }
  //     }
  //     setField('customFields', { ...state.customFields?.value, [value.name]: init });
  //   });
  // }
  // }, [orderLineCustomFields]);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const [
        { order },
        { eligibleShippingMethodsForDraftOrder },
        { history },
        {
          globalSettings: {
            serverConfig: {
              customFieldConfig: { OrderLine },
            },
          },
        },
      ] = await Promise.all([
        adminApiQuery({ order: [{ id }, draftOrderSelector] }),
        adminApiQuery({ eligibleShippingMethodsForDraftOrder: [{ orderId: id }, eligibleShippingMethodsSelector] }),
        getAllOrderHistory(id),
        adminApiQuery({
          globalSettings: { serverConfig: { customFieldConfig: { OrderLine: CustomFieldConfigSelector } } },
        }),
      ]);
      setDraftOrder(order);
      setEligibleShippingMethodsType(eligibleShippingMethodsForDraftOrder);
      setOrderHistory(history);
      setOrderLineCustomFieldsConfig(OrderLine);
    };
    fetch();
  }, [id]);

  const selectShippingMethod = async (orderId: string, shippingMethodId: string) => {
    const { setDraftOrderShippingMethod } = await adminApiMutation({
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
    else toast.error(`${setDraftOrderShippingMethod.errorCode}: ${setDraftOrderShippingMethod.message}`);
  };

  const addToOrder = async (productVariantId: string, quantity: number, customFields: Record<string, unknown>) => {
    const { addItemToDraftOrder } = await adminApiMutation({
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
    const { removeDraftOrderLine } = await adminApiMutation({
      removeDraftOrderLine: [{ orderId: id!, orderLineId }, removeOrderItemsResultSelector],
    });
    if (removeDraftOrderLine.__typename === 'Order') setDraftOrder(removeDraftOrderLine);
  };

  const adjustLineItem = async (orderLineId: string, quantity: number) => {
    const { adjustDraftOrderLine } = await adminApiMutation({
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
      const { setCustomerForDraftOrder } = await adminApiMutation({
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
    if (!id) return;
    const { transitionOrderToState } = await adminApiMutation({
      transitionOrderToState: [
        { id: id, state: 'ArrangingPayment' },
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
      const data = await getAllOrderHistory(id);
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
      if (createForCustomer && draftOrder?.customer?.id) {
        const { createCustomerAddress } = await adminApiMutation({
          createCustomerAddress: [{ customerId: draftOrder.customer.id, input: address }, { streetLine1: true }],
        });
        if (createCustomerAddress.streetLine1) {
          toast.success(t('selectAddress.newAddress', { address: createCustomerAddress.streetLine1 }));
        } else {
          toast.error(t('selectAddress.addressAddFailed'));
        }
      }
      const { setDraftOrderShippingAddress, setDraftOrderBillingAddress } = await adminApiMutation(
        isShipping
          ? { setDraftOrderShippingAddress: [{ orderId, input: address }, draftOrderSelector] }
          : { setDraftOrderBillingAddress: [{ orderId, input: address }, draftOrderSelector] },
      );
      if (setDraftOrderShippingAddress || setDraftOrderBillingAddress) {
        setDraftOrder(setDraftOrderShippingAddress || setDraftOrderBillingAddress);
        toast(
          t(createForCustomer ? 'selectAddress.addressSuccessCreateToast' : 'selectAddress.addressSuccessSelectToast'),
        );
      } else {
        toast.error(
          t(createForCustomer ? 'selectAddress.addressFailedCreateToast' : 'selectAddress.addressFailedSelectToast'),
        );
      }
    }
  };

  const addPaymentToOrder = async (input: ResolverInputTypes['ManualPaymentInput']) => {
    if (!id) return;
    const { addManualPaymentToOrder } = await adminApiMutation({
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
      const data = await getAllOrderHistory(id);
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
    const { addFulfillmentToOrder } = await adminApiMutation({
      addFulfillmentToOrder: [{ input }, addFulfillmentToOrderResultSelector],
    });
    if (addFulfillmentToOrder.__typename === 'Fulfillment') {
      const { transitionFulfillmentToState } = await adminApiMutation({
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
        const { order } = await adminApiQuery({ order: [{ id }, draftOrderSelector] });
        setDraftOrder(order);
        const data = await getAllOrderHistory(id);
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
    const { transitionFulfillmentToState } = await adminApiMutation({
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
      const { order } = await adminApiQuery({ order: [{ id }, draftOrderSelector] });
      setDraftOrder(order);
      const data = await getAllOrderHistory(id);
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
    const { addNoteToOrder } = await adminApiMutation({
      addNoteToOrder: [{ input }, { id: true }],
    });
    if (addNoteToOrder.id) {
      const { history } = await getAllOrderHistory(addNoteToOrder.id);
      setOrderHistory(history);
    } else toast.error('Something went wrong while adding note to order', { position: 'top-center' });
  };

  const deleteMessageFromOrder = async (id: string) => {
    const { deleteOrderNote } = await adminApiMutation({
      deleteOrderNote: [{ id }, { message: true, result: true }],
    });
    if (deleteOrderNote.result) {
      const { history } = await getAllOrderHistory(draftOrder?.id || '');
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

  const SubmitOrderButton = (
    <Button size="sm" onClick={onSubmit} disabled={!isOrderValid.valid}>
      {t('create.completeOrderButton')}
    </Button>
  );

  return (
    <main>
      <ManualOrderChangeModal
        open={manualChange}
        setOpen={setManualChange}
        order={draftOrder}
        currentPossibilities={currentPossibilities}
      />
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
                } else navigate('/orders');
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
                {SubmitOrderButton}
              </div>
            ) : draftOrder?.state === 'PaymentSettled' ? (
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <FulfillmentModal draftOrder={draftOrder} onSubmitted={fulfillOrder} />
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
                          {t('create.buttonAddPayment', { value: priceFormatter(draftOrder?.totalWithTax || 0) })}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('create.addPaymentTitle')}</DialogTitle>
                          <DialogDescription>{t('create.addPaymentDescription')}</DialogDescription>
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
            <PossibleOrderStates orderProcess={serverConfig?.orderProcess || []} orderState={draftOrder?.state || ''} />
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
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Button variant="ghost" className="w-full justify-start">
                    Anuluj zamówienie
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Button onClick={() => setManualChange(true)} variant="ghost" className="w-full justify-start">
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
                              await addToOrder(variantToAdd.id, 1, state.customFields?.value || {});
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
                            <CustomFieldsComponent
                              getValue={(field) => {
                                const value = state.customFields?.value
                                  ? state.customFields?.value[field.name as never]
                                  : '';
                                return value;
                              }}
                              setValue={(field, data) => {
                                setField('customFields', { ...state.customFields?.value, [field.name]: data });
                              }}
                              customFields={orderLineCustomFieldsConfig}
                              data={{ variantToAdd }}
                            />
                            {/* HERE COMPONENT FOR CUSTOM FIELDS */}
                            <div className="float-end flex flex-row justify-end gap-4">
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
              <TaxSummary order={draftOrder} />
              {draftOrder && orderHistory.length ? (
                <OrderHistory
                  orderHistory={orderHistory}
                  addMessageToOrder={(data) => addMessageToOrder({ id: draftOrder.id, ...data })}
                  deleteMessageFromOrder={deleteMessageFromOrder}
                />
              ) : null}
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
              <SummaryCard order={draftOrder} />
              <RealizationCard order={draftOrder} markAsDelivered={markAsDelivered} />
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
                defaultValue={draftOrder?.billingAddress}
                customerAddresses={draftOrder?.customer?.addresses}
              />
              <AddressCard
                isDraft={draftOrder?.state === 'Draft'}
                type="shipping"
                onSubmitted={handleMethodChange}
                orderId={draftOrder?.id}
                defaultValue={draftOrder?.shippingAddress}
                customerAddresses={draftOrder?.customer?.addresses}
              />
              <ShippingMethod
                order={draftOrder}
                shippingMethods={eligibleShippingMethodsType}
                onSelectShippingMethod={selectShippingMethod}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 md:hidden">
            <Button
              variant="outline"
              size="sm"
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
              {t('create.back')}
            </Button>
            {SubmitOrderButton}
          </div>
        </div>
      </div>
    </main>
  );
};
