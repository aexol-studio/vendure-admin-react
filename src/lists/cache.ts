/* eslint-disable @typescript-eslint/no-explicit-any */
export type PaginatedCacheables = 'products' | 'collections' | 'orders' | 'facets';
export type DetailCacheables = 'productDetail' | 'orderDetail' | 'collectionDetail' | 'facetDetail';

export const cache = <T>(cacheable: PaginatedCacheables | DetailCacheables, extraKey?: string) => {
  const cacheKey = extraKey ? `${cacheable}.${extraKey}` : cacheable;
  const getCacheable = (): Record<string, T> => {
    const v = window.localStorage.getItem(cacheKey);
    if (v) return JSON.parse(v);
    return {};
  };
  const set = (key: string, value: T) => {
    const currentCacheable = getCacheable();
    currentCacheable[key] = value;
    window.localStorage.setItem(cacheKey, JSON.stringify(currentCacheable));
  };
  const get = (key: string) => {
    const v = getCacheable()[key];
    if (!v) return;
    return v;
  };
  const reset = () => {
    window.localStorage.removeItem(cacheKey);
  };
  return {
    get,
    set,
    reset,
  };
};

export const resetCache = (cacheable: PaginatedCacheables | DetailCacheables, extraKey: string) => {
  const cacheKey = `${cacheable}.${extraKey}`;
  window.localStorage.removeItem(cacheKey);
};
