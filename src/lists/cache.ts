/* eslint-disable @typescript-eslint/no-explicit-any */
export type PaginatedCacheables = 'products' | 'collections' | 'orders';

export const cache = <T>(cacheable: PaginatedCacheables, limit: number) => {
  const cacheKey = `${cacheable}.${limit}`;
  const getCacheable = (): Record<number, T> => {
    const v = window.localStorage.getItem(cacheKey);
    if (v) return JSON.parse(v);
    return {};
  };
  const set = (page: number, value: T) => {
    const currentCacheable = getCacheable();
    currentCacheable[page] = value;
    window.localStorage.setItem(cacheKey, JSON.stringify(currentCacheable));
  };
  const get = (page: number) => {
    const v = getCacheable()[page];
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

export const resetCache = (cacheable: PaginatedCacheables, limit: number) => {
  const cacheKey = `${cacheable}.${limit}`;
  window.localStorage.removeItem(cacheKey);
};
