import React from 'react';
import { DefaultProps } from '../types';
import { AssetsRelationInput } from './AssetsRelationInput';
import { ProductRelationInput } from './ProductRelationInput';
import { ProductVariantRelationInput } from './ProductVariantRelationInput';

export function DefaultRelationInput<T>(props: DefaultProps<T>) {
  const { field } = props;
  if ('entity' in field) {
    switch (field.entity) {
      case 'Asset':
        return <AssetsRelationInput {...props} />;
      case 'Product':
        return <ProductRelationInput {...props} />;
      case 'ProductVariant':
        return <ProductVariantRelationInput {...props} />;
      default:
        console.log(`Entity ${field.entity} in list is not supported yet`);
        return (
          <div>
            Entity <strong>{field.entity.toUpperCase()}</strong> is not supported yet
          </div>
        );
    }
  }
  return null;
}
