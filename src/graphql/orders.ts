import { scalars } from '@/common/client';
import { Selector, FromSelector } from '@/zeus';

export const paymentSelector = Selector('Payment')({
  id: true,
  method: true,
  amount: true,
  state: true,
  errorMessage: true,
});

export type PaymentType = FromSelector<typeof paymentSelector, 'Payment', typeof scalars>;

export const discountsSelector = Selector('Discount')({
  type: true,
  description: true,
  amountWithTax: true,
  adjustmentSource: true,
});

export type DiscountsType = FromSelector<typeof discountsSelector, 'Discount', typeof scalars>;

export const shippingLineSelector = Selector('ShippingLine')({
  shippingMethod: {
    id: true,
    name: true,
    description: true,
  },
  priceWithTax: true,
});
export type ShippingLineType = FromSelector<typeof shippingLineSelector, 'ShippingLine', typeof scalars>;

export const ShippingMethodsSelector = Selector('ShippingMethodQuote')({
  id: true,
  name: true,
  price: true,
  description: true,
});

export type ShippingMethodType = FromSelector<typeof ShippingMethodsSelector, 'ShippingMethodQuote', typeof scalars>;

export const AvailablePaymentMethodsSelector = Selector('PaymentMethodQuote')({
  id: true,
  name: true,
  description: true,
  code: true,
  isEligible: true,
});

export type AvailablePaymentMethodsType = FromSelector<
  typeof AvailablePaymentMethodsSelector,
  'PaymentMethodQuote',
  typeof scalars
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

export type ActiveOrderType = FromSelector<typeof ActiveOrderSelector, 'Order', typeof scalars>;

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
export type OrderType = FromSelector<typeof OrderSelector, 'Order', typeof scalars>;
