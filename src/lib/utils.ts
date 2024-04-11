import { ModelTypes } from '@/zeus';
import { type ClassValue, clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { SetURLSearchParams, useSearchParams } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// const manageParamValue = (key: string, value: string) => {
//   const splitted = value.split(',');
//   if (splitted.includes(key)) {
//     return splitted.filter((l) => l !== key).join(',');
//   } else {
//     return [...splitted, key].join(',');
//   }
// };

// write function that gets two string arugments

// queryKey
// queryValue
// queryType

//?name=kurtka,eq&name=zimowa,notEq
// useManageSearchParam({ param: 'name', paramKey: 'eq', paramKeyValue: 'wartość inputa (zimowa)' });

interface ManageSearchParamArgs {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  param?: string;
  paramKey: string;
  paramKeyValue: string;
}
export type FilterType = Record<string, Record<string, string>>;

export const manageSearchParam = ({
  param,
  paramKey,
  paramKeyValue,
  searchParams,
  setSearchParams,
}: ManageSearchParamArgs) => {
  if (!param) return;
  const paramValues = searchParams.getAll(param);
  const filteredParamValues = paramValues.filter((v) => !v.includes(paramKey));
  searchParams.delete(param);
  if (!paramKeyValue.length) {
    filteredParamValues.forEach((newParam) => searchParams.append(param, newParam));
    setSearchParams(searchParams);
    return;
  }
  [`${paramKeyValue},${paramKey}`, ...filteredParamValues].forEach((newParam) => searchParams.append(param, newParam));
  setSearchParams(searchParams);
};
type FilterMode =
  | 'OrderFilterParameter'
  | 'CollectionFilterParameter'
  | 'FacetFilterParameter'
  | 'ProductFilterParameter';

type A = ModelTypes['OrderFilterParameter'];

export const useFilters = <T extends FilterMode>() => {
  const [filter, _setFilter] = useState<ModelTypes[T]>();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const filterFromParams = searchParams.get('filter');
    if (filterFromParams) {
      try {
        const filterFromParamsJSON = JSON.parse(filterFromParams) as ModelTypes[T];
        _setFilter(filterFromParamsJSON);
      } catch (err) {
        throw new Error(`Parsing filter searchParams Key to JSON failed: ${err}`);
      }
    } else {
      _setFilter(undefined);
    }
  }, [searchParams]);

  const setFilter = (filterField: keyof ModelTypes[T], filterSubfield: keyof ModelTypes[T][]) => {};
  return { filter, setFilter };
};
