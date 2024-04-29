import { adminApiMutation, adminApiQuery } from '@/common/client';
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  ProductVariantSearch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DraftOrderType,
  EligibleShippingMethodsType,
  draftOrderSelector,
  eligibleShippingMethodsSelector,
  orderHistoryEntrySelector,
  OrderHistoryEntryType,
  CreateAddressBaseType,
  SearchProductVariantType,
  addFulfillmentToOrderResultSelector,
  removeOrderItemsResultSelector,
  updatedDraftOrderSelector,
} from '@/graphql/draft_order';
import { ResolverInputTypes, SortOrder } from '@/zeus';
import { useTranslation } from 'react-i18next';
import { useServer } from '@/state/server';
import { toast } from 'sonner';
import { CustomFieldsComponent } from '@/custom_fields';
import { CustomFieldConfigType } from '@/graphql/base';
import { useGFFLP } from '@/lists/useGflp';
import {
  ManualOrderChangeModal,
  OrderStateBadge,
  FulfillmentModal,
  PossibleOrderStates,
  OrderSummary,
  RealizationCard,
  CustomerSelectCard,
  AddressCard,
  ShippingMethod,
  LineItem,
  TaxSummary,
  OrderHistory,
} from '@/pages/orders/_components';
import { priceFormatter } from '@/utils';
import { ChevronLeft, Grip } from 'lucide-react';

export type Mode = 'view' | 'create' | 'update';
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

export const OrderPage = () => {
  const { id } = useParams();
  const { t } = useTranslation('orders');
  const navigate = useNavigate();
  const serverConfig = useServer((p) => p.serverConfig);
  const paymentMethodsType = useServer((p) => p.paymentMethodsType);

  const [order, setOrder] = useState<DraftOrderType | undefined>();
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntryType[]>([]);
  const [loading, setLoading] = useState(true);

  const [variantToAdd, setVariantToAdd] = useState<SearchProductVariantType | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [manualChange, setManualChange] = useState(false);
  const { state, setField } = useGFFLP('AddItemToDraftOrderInput', 'customFields')({});
  const [orderLineCustomFieldsConfig, setOrderLineCustomFieldsConfig] = useState<CustomFieldConfigType[]>();

  const currentPossibilities = useMemo(() => {
    return serverConfig?.orderProcess?.find((state) => state.name === order?.state);
  }, [serverConfig, order]);

  useEffect(() => {
    const fetch = async () => {
      if (id) {
        setLoading(true);
        const [{ order }, { history }] = await Promise.all([
          adminApiQuery({ order: [{ id }, draftOrderSelector] }),
          getAllOrderHistory(id),
        ]);
        if (!order) toast.error(t('toasts.orderLoadingError', { value: id }));

        if (!history) toast.error(t('toasts.orderHistoryLoadingError', { value: id }));
        setOrder(order);
        setOrderHistory(history);
        setLoading(false);
      }
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
    if (setDraftOrderShippingMethod.__typename === 'Order') {
      setOrder(setDraftOrderShippingMethod);
    } else toast.error(`${setDraftOrderShippingMethod.errorCode}: ${setDraftOrderShippingMethod.message}`);
  };

  const addToOrder = async (productVariantId: string, quantity: number, customFields: Record<string, unknown>) => {
    const { addItemToDraftOrder } = await adminApiMutation({
      addItemToDraftOrder: [
        { input: { productVariantId, quantity, customFields }, orderId: id! },
        updatedDraftOrderSelector,
      ],
    });
    if (addItemToDraftOrder.__typename === 'Order' || addItemToDraftOrder.__typename === 'InsufficientStockError') {
      if (addItemToDraftOrder.__typename === 'Order') setOrder(addItemToDraftOrder);
      else setOrder(addItemToDraftOrder.order);
      setVariantToAdd(undefined);
      setOpen(false);
    }
  };

  const removeLineItem = async (orderLineId: string) => {
    const { removeDraftOrderLine } = await adminApiMutation({
      removeDraftOrderLine: [{ orderId: id!, orderLineId }, removeOrderItemsResultSelector],
    });
    if (removeDraftOrderLine.__typename === 'Order') setOrder(removeDraftOrderLine);
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
      if (adjustDraftOrderLine.__typename === 'Order') setOrder(adjustDraftOrderLine);
      else setOrder(adjustDraftOrderLine.order);
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
    const isValid = order?.shippingAddress && order?.billingAddress && order?.shippingLines.length && order?.customer;
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
      setOrder(transitionOrderToState);
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
      setOrder(addManualPaymentToOrder);
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
        setOrder(order);
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
      setOrder(order);
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
    } else {
      toast.error('Something went wrong while adding note to order', { position: 'top-center' });
    }
  };

  const deleteMessageFromOrder = async (id: string) => {
    const { deleteOrderNote } = await adminApiMutation({
      deleteOrderNote: [{ id }, { message: true, result: true }],
    });
    if (deleteOrderNote.result) {
      const { history } = await getAllOrderHistory(order?.id || '');
      setOrderHistory(history);
    } else {
      toast.error('Something went wrong while deleting note from order', { position: 'top-center' });
    }
  };

  const isOrderValid = useMemo(() => {
    const isVariantValid = order?.lines.every((line) => line.productVariant);
    const isCustomerValid = order?.customer?.id;
    const isBillingAddressValid = order?.billingAddress?.streetLine1;
    const isShippingAddressValid = order?.shippingAddress?.streetLine1;
    const isShippingMethodValid = order?.shippingLines?.length;
    return {
      valid:
        isVariantValid && isCustomerValid && isBillingAddressValid && isShippingAddressValid && isShippingMethodValid,
      isVariantValid,
      isCustomerValid,
      isBillingAddressValid,
      isShippingAddressValid,
      isShippingMethodValid,
    };
  }, [order]);

  const mode: Mode = useMemo(
    () =>
      order?.state === 'Draft' || order?.state === 'AddingItems' || order?.state === 'ArrangingPayment'
        ? 'create'
        : order?.state === 'PaymentSettled' ||
            order?.state === 'PaymentAuthorized' ||
            order?.state === 'PartiallyShipped'
          ? 'update'
          : 'view',
    [order],
  );

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {t('toasts.orderLoadingError', { value: id })}
      </div>
    );
  }
  return (
    <main>
      <ManualOrderChangeModal
        open={manualChange}
        setOpen={setManualChange}
        order={order}
        currentPossibilities={currentPossibilities}
      />
      <div className="mx-auto flex  w-full flex-col gap-4 2xl:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              if (order.state === 'Draft') {
                toast.error(t('create.leaveToastMessage'), {
                  position: 'top-center',
                  action: { label: t('create.leaveToastButton'), onClick: () => navigate('/orders') },
                });
              } else navigate('/orders');
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">{t('create.back')}</span>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {t('create.orderId', { value: order.id })}
          </h1>
          <OrderStateBadge state={order.state} />
          {order.state === 'Draft' ? (
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
          ) : order?.state === 'PaymentSettled' ? (
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
              <FulfillmentModal draftOrder={order} onSubmitted={fulfillOrder} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
              {order.state !== 'Shipped' &&
              order.state !== 'PartiallyShipped' &&
              order.state !== 'Delivered' &&
              order.state !== 'PartiallyDelivered' &&
              order.state !== 'Cancelled' &&
              order.state !== 'Fulfilled' &&
              order.state !== 'PartiallyFulfilled' ? (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm">
                        {t('create.buttonAddPayment', { value: priceFormatter(order.totalWithTax || 0) })}
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
                    disabled={order.state !== 'PaymentAuthorized'}
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
          <PossibleOrderStates orderState={order.state} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Grip className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-8 w-56">
              {order.state === 'PaymentSettled' ? (
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
        <OrderSummary order={order} />
        <RealizationCard order={order} markAsDelivered={markAsDelivered} />
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CustomerSelectCard mode={mode} order={order} setOrder={setOrder} />
          <AddressCard mode={mode} type="billing" order={order} setOrder={setOrder} />
          <AddressCard mode={mode} type="shipping" order={order} setOrder={setOrder} />

          <ShippingMethod order={order} onSelectShippingMethod={selectShippingMethod} />
        </div>

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
                          const value = state.customFields?.value ? state.customFields?.value[field.name as never] : '';
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
                  {order.lines.length ? (
                    order.lines.map((line) => (
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
        <TaxSummary order={order} />
        {order && orderHistory.length ? (
          <OrderHistory
            orderHistory={orderHistory}
            addMessageToOrder={(data) => addMessageToOrder({ id: order.id, ...data })}
            deleteMessageFromOrder={deleteMessageFromOrder}
          />
        ) : null}
      </div>
    </main>
  );
};
