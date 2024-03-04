import { PaginatedCacheables, cache } from '@/lists/cache';
import { GenericReturn, PromisePaginated } from '@/lists/models';
import { Pagination } from '@aexol-studio/styling-system';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useList = <T extends PromisePaginated>({
  route,
  limit,
  cacheKey,
}: {
  route: T;
  limit: number;
  cacheKey: PaginatedCacheables;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [total, setTotal] = useState(0);
  const [objects, setObjects] = useState<GenericReturn<T>>();

  const pageNumber = useMemo(() => {
    const page = searchParams.get('page');
    if (page) return parseInt(page);
    return 0;
  }, [searchParams]);

  useEffect(() => {
    const c = cache<{
      items: GenericReturn<T>;
      totalItems: number;
    }>(cacheKey, limit.toString());
    const valueFromCache = c.get(pageNumber.toString());
    if (valueFromCache) {
      setObjects(valueFromCache.items);
      setTotal(valueFromCache.totalItems);
      return;
    }
    route({
      page: pageNumber,
    }).then((r) => {
      setObjects(r.items);
      setTotal(r.totalItems);
      c.set(pageNumber.toString(), r);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber]);

  return {
    Paginate: (
      <Pagination
        page={pageNumber}
        onPageChange={(p) => {
          setSearchParams({
            page: p.toString(),
          });
        }}
        rowsPerPage={limit}
        totalRows={total}
      />
    ),
    total,
    objects,
  };
};
