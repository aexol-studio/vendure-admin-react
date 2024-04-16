import { ModelTypes, SortOrder } from '@/zeus';

export type PaginationInput = {
  page: number;
  perPage: number;
  sort?: { key: string; sortDir: SortOrder };
  filter?:
    | ModelTypes['OrderFilterParameter']
    | ModelTypes['CollectionFilterParameter']
    | ModelTypes['FacetFilterParameter']
    | ModelTypes['ProductFilterParameter'];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PromisePaginated = (props: PaginationInput) => Promise<{
  totalItems: number;
  items: any;
}>;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PromiseSearch = (props: PaginationInput) => Promise<
  {
    value: string;
    label: string;
  }[]
>;

export type GenericReturn<T extends PromisePaginated> =
  ReturnType<T> extends Promise<infer R>
    ? R extends {
        items: infer I;
      }
      ? I
      : never
    : never;

export type PromiseDetail = ({ slug }: { slug: string }) => Promise<any>;

export type GenericReturnDetail<T extends PromiseDetail> = ReturnType<T> extends Promise<infer R> ? R : never;
