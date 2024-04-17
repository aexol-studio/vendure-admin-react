import { ValueTypes } from '@/zeus';

export type OrdersSortOptions = keyof ValueTypes['OrderSortParameter'];
export const ordersSortOptionsArray: OrdersSortOptions[] = [
  'total',
  'code',
  'id',
  'customerLastName',
  'transactionId',
  'aggregateOrderId',
  'createdAt',
  'updatedAt',
  'orderPlacedAt',
  'state',
  'totalQuantity',
  'subTotal',
  'subTotalWithTax',
  'shipping',
  'shippingWithTax',
  'totalWithTax',
] as const;

export function isOrdersSortOptions(value: string): value is OrdersSortOptions {
  return ordersSortOptionsArray.some((i) => i === value);
}

export type CollectionsSortOptions = keyof ValueTypes['CollectionSortParameter'];
export const collectionsSortOptionsArray: CollectionsSortOptions[] = [
  'createdAt',
  'updatedAt',
  'slug',
  'position',
  'parentId',
  'name',
  'id',
  'description',
] as const;

export function isCollectionsSortOptions(value: string): value is CollectionsSortOptions {
  return collectionsSortOptionsArray.some((i) => i === value);
}
export type ProductsSortOptions = keyof ValueTypes['ProductSortParameter'];
export const productsSortOptionsArray: ProductsSortOptions[] = [
  'createdAt',
  'updatedAt',
  'slug',
  'name',
  'id',
  'description',
] as const;

export function isProductsSortOptions(value: string): value is ProductsSortOptions {
  return productsSortOptionsArray.some((i) => i === value);
}
export type FacetsSortOptions = keyof ValueTypes['FacetSortParameter'];
export const facetsSortOptionsArray: FacetsSortOptions[] = ['createdAt', 'updatedAt', 'name', 'id', 'code'] as const;

export function isFacetsSortOptions(value: string): value is FacetsSortOptions {
  return facetsSortOptionsArray.some((i) => i === value);
}
