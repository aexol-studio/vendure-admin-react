import React from 'react';
import { DefaultProps } from '../types';
import { AssetsRelationInput } from './AssetsRelationInput';

export const DefaultRelationInput = (props: DefaultProps<string>) => {
  const { field } = props;
  if ('entity' in field) {
    switch (field.entity) {
      case 'Asset':
        return <AssetsRelationInput {...props} />;
      case 'Order':
        return <div>Order</div>;
      case 'Product':
        return <div>Product</div>;
      case 'User':
        return <div>User</div>;
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
};
