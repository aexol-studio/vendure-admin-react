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
    productVariant: {
      id: true,
      sku: true,
      name: true,
      featuredAsset: { preview: true },
      product: { name: true, featuredAsset: { preview: true } },
    },
  },
});

export type DraftOrderType = FromSelectorWithScalars<typeof draftOrderSelector, 'Order'>;
