import { Selector } from '@/zeus';
import { FromSelectorWithScalars } from './scalars';

export const eligibleShippingMethodsSelector = Selector('ShippingMethod')({
  id: true,
  description: true,
  name: true,
  code: true,
});

export type EligibleShippingMethodsType = FromSelectorWithScalars<
  typeof eligibleShippingMethodsSelector,
  'ShippingMethod'
>;

export const addressBaseSelector = Selector('Address')({
  city: true,
  company: true,
  fullName: true,
  phoneNumber: true,
  postalCode: true,
  province: true,
  streetLine1: true,
  streetLine2: true,
});

export type AddressBaseType = FromSelectorWithScalars<typeof addressBaseSelector, 'Address'>;

export const createAddressBaseSelector = Selector('CreateAddressInput')({
  city: true,
  company: true,
  fullName: true,
  phoneNumber: true,
  postalCode: true,
  province: true,
  streetLine1: true,
  streetLine2: true,
  countryCode: true,
});

export type CreateAddressBaseType = FromSelectorWithScalars<typeof createAddressBaseSelector, 'CreateAddressInput'>;

export const searchProductVariantSelector = Selector('ProductVariant')({
  id: true,
  featuredAsset: { preview: true },
  sku: true,
  productId: true,
  product: { name: true, id: true, slug: true, featuredAsset: { preview: true } },
  currencyCode: true,
  price: true,
  priceWithTax: true,
  name: true,
  stockLevels: { stockOnHand: true },
});

export type SearchProductVariantType = FromSelectorWithScalars<typeof searchProductVariantSelector, 'ProductVariant'>;

export const searchCustomerSelector = Selector('Customer')({
  firstName: true,
  lastName: true,
  id: true,
  emailAddress: true,
  phoneNumber: true,
});

export type SearchCustomerType = FromSelectorWithScalars<typeof searchCustomerSelector, 'Customer'>;

export const draftOrderSelector = Selector('Order')({
  id: true,
  createdAt: true,
  updatedAt: true,
  code: true,
  state: true,
  total: true,
  totalWithTax: true,
  shipping: true,
  fulfillments: {
    id: true,
    createdAt: true,
    updatedAt: true,
    method: true,
    nextStates: true,
    state: true,
    summary: { fulfillmentId: true, orderLineId: true, quantity: true },
    trackingCode: true,
  },
  taxSummary: {
    description: true,
    taxBase: true,
    taxRate: true,
    taxTotal: true,
  },
  shippingLines: {
    id: true,
    price: true,
    priceWithTax: true,
    discountedPrice: true,
    discountedPriceWithTax: true,
    shippingMethod: {
      id: true,
      name: true,
      code: true,
      fulfillmentHandlerCode: true,
    },
  },
  billingAddress: {
    countryCode: true,
    country: true,
    ...addressBaseSelector,
  },
  shippingAddress: {
    countryCode: true,
    country: true,
    ...addressBaseSelector,
  },
  customer: {
    id: true,
    title: true,
    firstName: true,
    lastName: true,
    phoneNumber: true,
    emailAddress: true,
    addresses: {
      id: true,
      defaultBillingAddress: true,
      defaultShippingAddress: true,
      country: { code: true, name: true },
      ...addressBaseSelector,
    },
  },
  lines: {
    id: true,
    quantity: true,
    productVariant: searchProductVariantSelector,
    customFields: {
      attributes: true,
      discountBy: true,
      selectedImage: { id: true, preview: true },
    },
  },
});

export type DraftOrderType = FromSelectorWithScalars<typeof draftOrderSelector, 'Order'>;

export const updatedDraftOrderSelector = Selector('UpdateOrderItemsResult')({
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
});

export const removeOrderItemsResultSelector = Selector('RemoveOrderItemsResult')({
  __typename: true,
  '...on Order': draftOrderSelector,
  '...on OrderModificationError': {
    errorCode: true,
    message: true,
  },
});

export const orderHistoryEntrySelector = Selector('HistoryEntry')({
  id: true,
  administrator: { id: true, firstName: true, lastName: true },
  isPublic: true,
  type: true,
  data: true,
});

export type OrderHistoryEntryType = FromSelectorWithScalars<typeof orderHistoryEntrySelector, 'HistoryEntry'>;

export const addFulfillmentToOrderResultSelector = Selector('AddFulfillmentToOrderResult')({
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
});
