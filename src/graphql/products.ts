import { scalars } from '@/common/client';
import { Selector, FromSelector } from '@/zeus';

export const YAMLProductsSelector = Selector('Product')({
  id: true,
  name: true,
  slug: true,
  featuredAsset: {
    source: true,
    preview: true,
  },
  collections: {
    name: true,
    slug: true,
  },
  variants: {
    id: true,
    name: true,
    currencyCode: true,
    priceWithTax: true,
    stockLevel: true,
    assets: {
      source: true,
      preview: true,
    },
    featuredAsset: {
      source: true,
      preview: true,
    },
  },
});

export type YAMLProductsType = FromSelector<typeof YAMLProductsSelector, 'Product', typeof scalars>;

export const productVariantTileSelector = Selector('ProductVariant')({
  id: true,
  name: true,
  currencyCode: true,
  priceWithTax: true,
  featuredAsset: { preview: true },
  product: {
    collections: { slug: true, name: true, parent: { slug: true } },
    slug: true,
    featuredAsset: { preview: true },
  },
});

export type ProductVariantTileType = FromSelector<typeof productVariantTileSelector, 'ProductVariant', typeof scalars>;
