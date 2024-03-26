import { scalars } from '@/common/client';
import { Selector, FromSelector } from '@/zeus';

export type FiltersFacetType = FacetType & { values: (FacetType & { count: number })[] };

export const FacetSelector = Selector('Facet')({
  id: true,
  name: true,
  code: true,
});

export type FacetType = FromSelector<typeof FacetSelector, 'Facet', typeof scalars>;

export const ProductTileSelector = Selector('Product')({
  id: true,
  name: true,
  slug: true,
  enabled: true,
  collections: {
    name: true,
    slug: true,
  },
  variantList: [{}, { totalItems: true }],
  featuredAsset: {
    source: true,
    preview: true,
  },
});

export const ProductSearchSelector = Selector('SearchResult')({
  productName: true,
  slug: true,
  collectionIds: true,
  currencyCode: true,
  productVariantId: true,
  productVariantName: true,
  priceWithTax: {
    '...on PriceRange': {
      max: true,
      min: true,
    },
    '...on SinglePrice': {
      value: true,
    },
  },
  facetIds: true,
  facetValueIds: true,
  productAsset: {
    preview: true,
  },
  description: true,
});
export type ProductSearchType = FromSelector<typeof ProductSearchSelector, 'SearchResult', typeof scalars>;
export type ProductDetailsFacetType = FromSelector<typeof ProductDetailsFacetSelector, 'FacetValue', typeof scalars>;
export const SearchSelector = Selector('SearchResponse')({
  items: ProductSearchSelector,
  totalItems: true,
  facetValues: {
    count: true,
    facetValue: {
      ...FacetSelector,
      facet: FacetSelector,
    },
  },
});

export type SearchType = FromSelector<typeof SearchSelector, 'SearchResponse', typeof scalars>;

export const ProductSlugSelector = Selector('Product')({
  name: true,
  description: true,
  id: true,
  slug: true,
  facetValues: {
    name: true,
    code: true,
  },
});

export const ProductDetailsFacetSelector = Selector('FacetValue')({
  name: true,
  id: true,
  translations: { name: true, languageCode: true, id: true },
});

export const ProductDetailSelector = Selector('Product')({
  name: true,
  description: true,
  id: true,
  slug: true,
  enabled: true,
  optionGroups: {
    name: true,
    id: true,
    code: true,
    options: {
      name: true,
      id: true,
      code: true,
    },
  },
  translations: {
    languageCode: true,
    name: true,
    slug: true,
    description: true,
    id: true,
  },
  assets: {
    source: true,
    preview: true,
  },
  variants: {
    id: true,
    name: true,
    currencyCode: true,
    priceWithTax: true,
    stockLevel: true,
    sku: true,
    price: true,
    translations: {
      name: true,
      languageCode: true,
    },
    taxCategory: {
      name: true,
      id: true,
    },
    taxRateApplied: {
      name: true,
      id: true,
    },
    prices: {
      currencyCode: true,
      price: true,
    },
    options: {
      id: true,
      groupId: true,
      code: true,
      name: true,
    },
  },
  collections: { slug: true, name: true, parent: { slug: true } },
  featuredAsset: {
    source: true,
    preview: true,
  },

  facetValues: ProductDetailsFacetSelector,
});

export type ProductDetailType = FromSelector<typeof ProductDetailSelector, 'Product', typeof scalars>;

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
export const NewestProductSelector = Selector('Product')({
  name: true,
  slug: true,
  featuredAsset: {
    source: true,
    preview: true,
  },
});

export type NewestProductType = FromSelector<typeof NewestProductSelector, 'Product', typeof scalars>;

export type ProductTileType = FromSelector<typeof ProductTileSelector, 'Product', typeof scalars>;

export const ProductVariantSelector = Selector('ProductVariant')({
  id: true,
  name: true,
  slug: true,
  collections: {
    name: true,
  },
  variants: {
    currencyCode: true,
    price: true,
  },
  featuredAsset: {
    source: true,
    preview: true,
  },
});
