import { Selector } from '@/zeus';
import { FromSelectorWithScalars } from './scalars';

export const eligibleShippingMethodsSelector = Selector('ShippingMethod')({
  id: true,
  description: true,
  metadata: true,
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
});

export type SearchProductVariantType = FromSelectorWithScalars<typeof searchProductVariantSelector, 'ProductVariant'>;

export const searchCustomerSelector = Selector('Customer')({
  firstName: true,
  lastName: true,
  id: true,
  emailAddress: true,
});

export type SearchCustomerType = FromSelectorWithScalars<typeof searchCustomerSelector, 'Customer'>;

export const draftOrderSelector = Selector('Order')({
  id: true,
  createdAt: true,
  updatedAt: true,
  code: true,
  state: true,
  total: true,
  shippingLines: { id: true },
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
