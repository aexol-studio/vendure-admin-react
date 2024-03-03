/* eslint-disable @typescript-eslint/no-explicit-any */
export type PromisePaginated = ({ page }: { page: number }) => Promise<{
  totalItems: number;
  items: any;
}>;

export type GenericReturn<T extends PromisePaginated> =
  ReturnType<T> extends Promise<infer R>
    ? R extends {
        items: infer I;
      }
      ? I
      : never
    : never;
