// import { ModelTypes } from '@/zeus';

export type ParamObjectT = {
  param?: string;
  paramKey: string;
  placeholder: string;
  label?: string;
};

// // Define ParamObjectT with param and paramKey constrained based on the mapping
// export type ParamObjectT2 = {
//   param?: FilterParameterKeys;
//   paramKey: ParamKeyMapping[FilterParameterKeys];
//   placeholder: string;
//   label?: string;
// };

// // Example usage
// const exampleParam: ParamObjectT2 = {
//   param: 'isPrivate',
//   paramKey: 'eq', // Allowed values are 'contains', 'startsWith', 'endsWith', etc. based on 'name' type
//   placeholder: 'Enter value',
// };

//define paramKey as keys of operatorFields related to mainParam or param key
// type FilterOperators =
//   | keyof ModelTypes['IDOperators']
//   | keyof ModelTypes['StringOperators']
//   | keyof ModelTypes['DateOperators']
//   | keyof ModelTypes['DateOperators'];

// type SearchFilters = ModelTypes['ProductFilterParameter' | 'CollectionFilterParameter' | 'OrderFilterParameter'];

// searchParamsKeys
// type IDOperatorKey = keyof ModelTypes['IDOperators'];
// type StringOperatorKey = keyof ModelTypes['StringOperators'];
// type DateOperatorKey = keyof ModelTypes['DateOperators'];
// type BooleanOperatorKey = keyof ModelTypes['BooleanOperators'];
// type NumberOperator = keyof ModelTypes['NumberOperators'];

// type ModelTypesKeysUnion = IDOperatorKey | StringOperatorKey | DateOperatorKey | BooleanOperatorKey | NumberOperator;

export interface SearchPropsI {
  defaultSearch: ParamObjectT;
  advancedSearch?: {
    title: string;
    actionTitle: string;
    paramsArray: { title: string; mainParam?: string; array: ParamObjectT[] }[];
  };
}
const idOperatorParam: ParamObjectT[] = [
  { paramKey: 'eq', placeholder: 'Search..', label: 'Equal' },
  { paramKey: 'notEq', placeholder: 'Search..', label: 'Not Equal' },
  { paramKey: 'in', placeholder: 'Search..', label: 'In' },
  { paramKey: 'notIn', placeholder: 'Search..', label: 'Not in' },
];
// const stringOperatorParam = [];
// const dateOperatorParam = [];
// const booleanOperatorParam = [];
// const numberOperatorParam = [];

// TO-DO: paramKey can by StringOperator IDOperator DateOperator BooleanOperator NumberOperator, we need diffrent inputs types, and we need to change managePAramsFunction to include this types (boolean vs rest)
//TO-DO: filter from useFilters page param and skip param
// TO-DO: include in SearchProps rest of props
export const productsSearchProps: SearchPropsI = {
  defaultSearch: { param: 'name', paramKey: 'eq', placeholder: 'Search by name..' },
  advancedSearch: {
    actionTitle: 'Advanced Search',
    title: 'Advanced products search',
    paramsArray: [
      {
        title: 'By facet value ID',
        mainParam: 'facetValueId',
        array: idOperatorParam,
      },
      {
        title: 'By ID',
        mainParam: 'id',
        array: idOperatorParam,
      },
      {
        title: 'By language code',
        mainParam: 'languageCode',
        array: idOperatorParam,
      },
      {
        title: 'By name',
        mainParam: 'name',
        array: idOperatorParam,
      },
      {
        title: 'By slug',
        mainParam: 'slug',
        array: idOperatorParam,
      },
      {
        title: 'By description',
        mainParam: 'description',
        array: idOperatorParam,
      },
    ],
  },
};

export const collectionSearchProps: SearchPropsI = {
  defaultSearch: { param: 'name', paramKey: 'eq', placeholder: 'Search by name..' },
  advancedSearch: {
    actionTitle: 'Advanced Search',
    title: 'Advanced collection search',
    paramsArray: [
      {
        title: 'By parent ID',
        mainParam: 'parentId',
        array: idOperatorParam,
      },
      {
        title: 'By ID',
        mainParam: 'id',
        array: idOperatorParam,
      },
      {
        title: 'By language code',
        mainParam: 'languageCode',
        array: idOperatorParam,
      },
      {
        title: 'By name',
        mainParam: 'name',
        array: idOperatorParam,
      },
      {
        title: 'By slug',
        mainParam: 'slug',
        array: idOperatorParam,
      },
      {
        title: 'By description',
        mainParam: 'description',
        array: idOperatorParam,
      },
    ],
  },
};

export const ordersSearchProps: SearchPropsI = {
  defaultSearch: { param: 'customerLastName', paramKey: 'contains', placeholder: 'Search by last name..' },
  advancedSearch: {
    actionTitle: 'Advanced Search',
    title: 'Advanced orders search',
    paramsArray: [
      {
        title: 'By transaction ID',
        mainParam: 'transactionId',
        array: idOperatorParam,
      },
      {
        title: 'By aggregate order ID',
        mainParam: 'aggregateOrderId',
        array: idOperatorParam,
      },
      {
        title: 'By ID',
        mainParam: 'id',
        array: idOperatorParam,
      },
      {
        title: 'By type',
        mainParam: 'type',
        array: idOperatorParam,
      },
      {
        title: 'By code',
        mainParam: 'code',
        array: idOperatorParam,
      },
      {
        title: 'By state',
        mainParam: 'state',
        array: idOperatorParam,
      },
      {
        title: 'By currency code',
        mainParam: 'currencyCode',
        array: idOperatorParam,
      },
    ],
  },
};
