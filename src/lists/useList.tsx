import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginatedCacheables, cache } from '@/lists/cache';
import { GenericReturn, PromisePaginated } from '@/lists/models';
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

  const sortMethod = useMemo(() => {
    const sort = searchParams.get('sort');
    if (sort) return sort;
    return;
  }, [searchParams]);

  useEffect(() => {
    const c = cache<{
      items: GenericReturn<T>;
      totalItems: number;
    }>(cacheKey);
    const valueFromCache = c.get(pageNumber.toString());
    if (valueFromCache) {
      setObjects(valueFromCache.items);
      setTotal(valueFromCache.totalItems);
      return;
    }
    route({
      page: pageNumber,
      sort: sortMethod,
    }).then((r) => {
      setObjects(r.items);
      setTotal(r.totalItems);
      c.set(pageNumber.toString(), r);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, sortMethod]);

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const pagesArray = new Array(totalPages).fill(0);

  const nextPage = () => {
    const nPage = (pageNumber + 1) % totalPages;
    if (nPage === 0) return 1;
    return nPage;
  };
  const prevPage = () => {
    const nPage = (pageNumber + -1) % totalPages;
    if (nPage === 0) return totalPages - 1;
    return nPage;
  };
  return {
    Paginate: (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => {
                setSearchParams({
                  page: prevPage().toString(),
                });
              }}
            />
          </PaginationItem>
          {pagesArray.map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => {
                  setSearchParams({
                    page: i.toString(),
                  });
                }}
                isActive={i + 1 === pageNumber}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          ))}
          {/* <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem> */}
          <PaginationItem>
            <PaginationNext
              onClick={() => {
                setSearchParams({
                  page: nextPage().toString(),
                });
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    ),
    total,
    objects,
    sort: (method: string) =>
      setSearchParams({
        sort: method,
      }),
  };
};
