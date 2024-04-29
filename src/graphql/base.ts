import { productVariantTileSelector } from '@/graphql/products';
import { FromSelectorWithScalars } from '@/graphql/scalars';
import { Selector, SortOrder } from '@/zeus';

export type OrderStateType =
  | 'Created'
  | 'Draft'
  | 'AddingItems'
  | 'Cancelled'
  | 'ArrangingPayment'
  | 'PaymentAuthorized'
  | 'PaymentSettled'
  | 'PartiallyShipped'
  | 'Shipped'
  | 'PartiallyDelivered'
  | 'Delivered'
  | 'Modifying'
  | 'ArrangingAdditionalPayment';
  
export type NavigationType = CollectionTileType & {
  productVariants?: {
    items: CollectionTileProductVariantType[];
    totalItems: number;
  };
};

export const assetsSelector = Selector('Asset')({
  id: true,
  createdAt: true,
  fileSize: true,
  focalPoint: { x: true, y: true },
  width: true,
  height: true,
  mimeType: true,
  preview: true,
  source: true,
  name: true,
});

export type AssetType = FromSelectorWithScalars<typeof assetsSelector, 'Asset'>;

const samePartOfCustomFieldConfig = {
  name: true,
  type: true,
  ui: true,
  label: { languageCode: true, value: true },
  description: { languageCode: true, value: true },
  internal: true,
  list: true,
  nullable: true,
  readonly: true,
};

export const CustomFieldConfigSelector = Selector('CustomFieldConfig')({
  __typename: true,
  '...on BooleanCustomFieldConfig': samePartOfCustomFieldConfig,
  '...on DateTimeCustomFieldConfig': samePartOfCustomFieldConfig,
  '...on FloatCustomFieldConfig': samePartOfCustomFieldConfig,
  '...on TextCustomFieldConfig': samePartOfCustomFieldConfig,
  '...on LocaleTextCustomFieldConfig': samePartOfCustomFieldConfig,
  '...on IntCustomFieldConfig': {
    ...samePartOfCustomFieldConfig,
    max: true,
    min: true,
    step: true,
  },
  '...on LocaleStringCustomFieldConfig': {
    ...samePartOfCustomFieldConfig,
    length: true,
    pattern: true,
  },
  '...on RelationCustomFieldConfig': {
    ...samePartOfCustomFieldConfig,
    entity: true,
    scalarFields: true,
  },
  '...on StringCustomFieldConfig': {
    ...samePartOfCustomFieldConfig,
    length: true,
    options: {
      value: true,
      label: {
        languageCode: true,
        value: true,
      },
    },
    pattern: true,
  },
});

export type CustomFieldConfigType = FromSelectorWithScalars<typeof CustomFieldConfigSelector, 'CustomFieldConfig'>;

export const CollectionSelector = Selector('Collection')({
  name: true,
  slug: true,
  description: true,
  featuredAsset: {
    preview: true,
  },
  parent: { slug: true, name: true },
  children: {
    id: true,
    name: true,
    slug: true,
    featuredAsset: { preview: true },
  },
});

export type CollectionType = FromSelectorWithScalars<typeof CollectionSelector, 'Collection'>;

export const CollectionTileProductVariantSelector = Selector('ProductVariant')({
  id: true,
  featuredAsset: { preview: true },
  priceWithTax: true,
  currencyCode: true,
  name: true,
  product: { name: true, slug: true, featuredAsset: { preview: true } },
});

export type CollectionTileProductVariantType = FromSelectorWithScalars<
  typeof CollectionTileProductVariantSelector,
  'ProductVariant'
>;

export const CollectionTileSelector = Selector('Collection')({
  name: true,
  id: true,
  slug: true,
  parentId: true,
  parent: { slug: true },
  description: true,
  featuredAsset: {
    preview: true,
  },
});

export type CollectionTileType = FromSelectorWithScalars<typeof CollectionTileSelector, 'Collection'>;

export const AvailableCountriesSelector = Selector('Country')({
  code: true,
  name: true,
  languageCode: true,
});
export type AvailableCountriesType = FromSelectorWithScalars<typeof AvailableCountriesSelector, 'Country'>;

export const OrderAddressSelector = Selector('OrderAddress')({
  fullName: true,
  company: true,
  streetLine1: true,
  streetLine2: true,
  city: true,
  province: true,
  postalCode: true,
  phoneNumber: true,
});

export type OrderAddressType = FromSelectorWithScalars<typeof OrderAddressSelector, 'OrderAddress'>;

export const ActiveAddressSelector = Selector('Address')({
  ...OrderAddressSelector,
  id: true,
  country: AvailableCountriesSelector,
  defaultShippingAddress: true,
  defaultBillingAddress: true,
});

export type ActiveAddressType = FromSelectorWithScalars<typeof ActiveAddressSelector, 'Address'>;

export const EditActiveAddressSelector = Selector('UpdateAddressInput')({
  id: true,
  fullName: true,
  company: true,
  streetLine1: true,
  streetLine2: true,
  city: true,
  province: true,
  postalCode: true,
  countryCode: true,
  phoneNumber: true,
  defaultShippingAddress: true,
  defaultBillingAddress: true,
});

export type EditActiveAddressType = FromSelectorWithScalars<typeof EditActiveAddressSelector, 'UpdateAddressInput'>;

export const CurrentUserSelector = Selector('CurrentUser')({
  id: true,
  identifier: true,
});

export type CurrentUserType = FromSelectorWithScalars<typeof CurrentUserSelector, 'CurrentUser'>;

export const ActiveCustomerSelector = Selector('Customer')({
  id: true,
  lastName: true,
  firstName: true,
  emailAddress: true,
  phoneNumber: true,
  addresses: ActiveAddressSelector,
  user: CurrentUserSelector,
});

export type ActiveCustomerType = FromSelectorWithScalars<typeof ActiveCustomerSelector, 'Customer'>;
export const CreateCustomerSelector = Selector('CreateCustomerInput')({
  emailAddress: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
});

export type CreateCustomerType = FromSelectorWithScalars<typeof CreateCustomerSelector, 'CreateCustomerInput'>;

export const CreateAddressSelector = Selector('CreateAddressInput')({
  fullName: true,
  company: true,
  streetLine1: true,
  streetLine2: true,
  city: true,
  province: true,
  postalCode: true,
  countryCode: true,
  phoneNumber: true,
  defaultShippingAddress: true,
  defaultBillingAddress: true,
});

export type CreateAddressType = FromSelectorWithScalars<typeof CreateAddressSelector, 'CreateAddressInput'>;

export type LoginCustomerInputType = {
  emailAddress: string;
  password: string;
  rememberMe: boolean;
};

export const homePageSlidersSelector = Selector('Collection')({
  name: true,
  slug: true,
  parent: { slug: true },
  productVariants: [
    { options: { take: 8, sort: { priceWithTax: SortOrder.DESC } } },
    {
      totalItems: true,
      items: productVariantTileSelector,
    },
  ],
});

export type HomePageSlidersType = FromSelectorWithScalars<typeof homePageSlidersSelector, 'Collection'>;

export const AdminSettingsSelector = Selector('GlobalSettings')({
  availableLanguages: true,
});

export const serverConfigSelector = Selector('ServerConfig')({
  // plugins: { name: true, version: true, path: true, active: true, status: true },
  // entityCustomFields: { customFields: CustomFieldConfigSelector, entityName: true },
  // moneyStrategyPrecision: true,
  customFieldConfig: { OrderLine: CustomFieldConfigSelector },
  orderProcess: { name: true, to: true },
  permissions: { assignable: true, description: true, name: true },
  permittedAssetTypes: true,
});

export type ServerConfigType = FromSelectorWithScalars<typeof serverConfigSelector, 'ServerConfig'>;

export const activeAdministratorSelector = Selector('Administrator')({
  id: true,
  emailAddress: true,
  firstName: true,
  lastName: true,
});

export type ActiveAdministratorType = FromSelectorWithScalars<typeof activeAdministratorSelector, 'Administrator'>;

export const countrySelector = Selector('Country')({
  code: true,
  name: true,
});

export type CountryType = FromSelectorWithScalars<typeof countrySelector, 'Country'>;

export const channelSelector = Selector('Channel')({
  id: true,
  code: true,
  token: true,
  currencyCode: true,
  defaultLanguageCode: true,
});

export type ChannelType = FromSelectorWithScalars<typeof channelSelector, 'Channel'>;

export const paymentMethodsSelector = Selector('PaymentMethod')({
  id: true,
  name: true,
  description: true,
  enabled: true,
});

export type PaymentMethodsType = FromSelectorWithScalars<typeof paymentMethodsSelector, 'PaymentMethod'>;

export const configurableOperationDefinitionSelector = Selector('ConfigurableOperationDefinition')({
  args: {
    __typename: true,
    defaultValue: true,
    description: true,
    label: true,
    list: true,
    name: true,
    required: true,
    type: true,
    ui: true,
  },
  code: true,
  description: true,
});

export type ConfigurableOperationDefinitionType = FromSelectorWithScalars<
  typeof configurableOperationDefinitionSelector,
  'ConfigurableOperationDefinition'
>;
