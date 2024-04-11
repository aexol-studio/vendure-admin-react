import { FromSelectorWithScalars } from '@/graphql/scalars';
import { Selector } from '@/zeus';

export const paymentSelector = Selector('Payment')({
  id: true,
  method: true,
  amount: true,
  state: true,
  errorMessage: true,
});

export type PaymentType = FromSelectorWithScalars<typeof paymentSelector, 'Payment'>;

export const discountsSelector = Selector('Discount')({
  type: true,
  description: true,
  amountWithTax: true,
  adjustmentSource: true,
});

export type DiscountsType = FromSelectorWithScalars<typeof discountsSelector, 'Discount'>;

export const shippingLineSelector = Selector('ShippingLine')({
  shippingMethod: {
    id: true,
    name: true,
    description: true,
  },
  priceWithTax: true,
});
export type ShippingLineType = FromSelectorWithScalars<typeof shippingLineSelector, 'ShippingLine'>;

export const ShippingMethodsSelector = Selector('ShippingMethodQuote')({
  id: true,
  name: true,
  price: true,
  description: true,
});

export type ShippingMethodType = FromSelectorWithScalars<typeof ShippingMethodsSelector, 'ShippingMethodQuote'>;

export const AvailablePaymentMethodsSelector = Selector('PaymentMethodQuote')({
  id: true,
  name: true,
  description: true,
  code: true,
  isEligible: true,
});

export type AvailablePaymentMethodsType = FromSelectorWithScalars<
  typeof AvailablePaymentMethodsSelector,
  'PaymentMethodQuote'
>;

export const ActiveOrderSelector = Selector('Order')({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalQuantity: true,
  couponCodes: true,
  code: true,
  customer: { id: true, emailAddress: true, firstName: true, lastName: true, phoneNumber: true },

  shippingWithTax: true,
  totalWithTax: true,
  subTotalWithTax: true,
  discounts: discountsSelector,
  state: true,
  active: true,
  payments: paymentSelector,
  currencyCode: true,
  shippingLines: shippingLineSelector,

  lines: {
    id: true,
    quantity: true,
    linePriceWithTax: true,
    unitPriceWithTax: true,
    discountedLinePriceWithTax: true,
    featuredAsset: {
      id: true,
      preview: true,
    },
    productVariant: {
      name: true,
      id: true,
      sku: true,
      price: true,
      featuredAsset: {
        id: true,
        source: true,
      },
      stockLevel: true,
      product: {
        name: true,
        slug: true,
      },
    },
  },
});

export type ActiveOrderType = FromSelectorWithScalars<typeof ActiveOrderSelector, 'Order'>;
export const OrderListSelector = Selector('Order')({
  type: true,
  totalWithTax: true,
  state: true,
  active: true,
  currencyCode: true,
  createdAt: true,
  updatedAt: true,
  shipping: true,
  orderPlacedAt: true,
  code: true,
  id: true,
  shippingAddress: {
    fullName: true,
  },
  customer: {
    emailAddress: true,
    firstName: true,
    lastName: true,
    phoneNumber: true,
  },
});
export type OrderListType = FromSelectorWithScalars<typeof OrderListSelector, 'Order'>;
export const OrderSelector = Selector('Order')({
  type: true,
  shippingWithTax: true,
  totalWithTax: true,
  subTotalWithTax: true,
  discounts: discountsSelector,
  state: true,
  active: true,
  payments: paymentSelector,
  currencyCode: true,
  shippingLines: shippingLineSelector,
  id: true,
  lines: {
    id: true,
    quantity: true,
    linePriceWithTax: true,
    unitPriceWithTax: true,
    discountedLinePriceWithTax: true,
    featuredAsset: {
      id: true,
      preview: true,
    },
    productVariant: {
      name: true,
      currencyCode: true,
      featuredAsset: {
        id: true,
        source: true,
      },
      product: {
        slug: true,
        name: true,
      },
    },
  },
});
export type OrderType = FromSelectorWithScalars<typeof OrderSelector, 'Order'>;
