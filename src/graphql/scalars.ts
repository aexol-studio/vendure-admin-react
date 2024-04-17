import { FromSelector, GraphQLTypes, ZeusScalars } from '@/zeus';

export const scalars = ZeusScalars({
  Money: {
    decode: (e) => e as number,
  },
  JSON: {
    encode: (e: unknown) => JSON.stringify(JSON.stringify(e)),
    decode: (e: unknown) => JSON.parse(e as string),
  },
  DateTime: {
    decode: (e: unknown) => new Date(e as string).toISOString(),
    encode: (e: unknown) => (e as Date).toISOString(),
  },
});
export type ScalarsType = typeof scalars;

export type FromSelectorWithScalars<SELECTOR, NAME extends keyof GraphQLTypes> = FromSelector<
  SELECTOR,
  NAME,
  ScalarsType
>;
