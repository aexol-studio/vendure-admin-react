/* eslint-disable @typescript-eslint/no-explicit-any */
export type PaginatedCacheables = 'products' | 'collections' | 'orders' | 'facets';
export type DetailCacheables = 'productDetail' | 'orderDetail' | 'collectionDetail' | 'facetDetail';

export const cache = <T>(cacheKey: PaginatedCacheables | DetailCacheables) => {
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

  const resetCache = () => {
    window.localStorage.removeItem(cacheKey);
  };

  const resetKey = (key: string) => {
    const currentCacheable = getCacheable();
    delete currentCacheable[key];
    window.localStorage.setItem(cacheKey, JSON.stringify(currentCacheable));
  };

  return {
    get,
    set,
    resetCache,
    resetKey,
  };
};

export const resetCache = (cacheKey: PaginatedCacheables | DetailCacheables) => {
  window.localStorage.removeItem(cacheKey);
};
