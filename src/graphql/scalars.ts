import { FromSelector, GraphQLTypes, ZeusScalars } from '@/zeus';

export const scalars = ZeusScalars({
  Money: {
    decode: (e) => e as number,
  },
  DateTime: {
    decode: (e: unknown) => new Date(e as string).toISOString(),
    encode: (e: unknown) => (e as Date).toISOString(),
  },
  JSON: {
    decode: (e) => e as Record<string, unknown>,
  },
});
export type ScalarsType = typeof scalars;

export type FromSelectorWithScalars<SELECTOR, NAME extends keyof GraphQLTypes> = FromSelector<
  SELECTOR,
  NAME,
  ScalarsType
>;
