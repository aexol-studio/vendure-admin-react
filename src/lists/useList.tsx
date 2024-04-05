import { Stack } from '@/components/ui/Stack';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PaginatedCacheables, cache } from '@/lists/cache';
import { GenericReturn, PaginationInput, PromisePaginated } from '@/lists/models';
import { SortOrder } from '@/zeus';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

type LimitKeys = '10perPage' | '25perPage' | '50perPage' | '100perPage';

const ITEMS_PER_PAGE: { name: LimitKeys; value: number }[] = [
  { name: '10perPage', value: 10 },
  { name: '25perPage', value: 25 },
  { name: '50perPage', value: 50 },
  { name: '100perPage', value: 100 },
] as const;

const enum SearchParamKey {
  PAGE = 'page',
  PER_PAGE = 'perPage',
  SORT = 'sort',
  SORT_DIR = 'sortDir',
}

const arrayRange = (start: number, stop: number) =>
  Array.from({ length: stop - start + 1 }, (_, index) => start + index);

export const useList = <T extends PromisePaginated>({
  route,
  cacheKey,
}: {
  route: T;
  cacheKey: PaginatedCacheables;
}) => {
  const { t } = useTranslation('common');
  const [searchParams, setSearchParams] = useSearchParams();
  const [total, setTotal] = useState(0);
  const [objects, setObjects] = useState<GenericReturn<T>>();

  const searchParamValues: PaginationInput = useMemo(() => {
    const page = searchParams.get(SearchParamKey.PAGE);
    const perPage = searchParams.get(SearchParamKey.PER_PAGE);
    const sort = searchParams.get(SearchParamKey.SORT);
    const sortDir = searchParams.get(SearchParamKey.SORT_DIR);
    console.log('aaaaaa', perPage);

    return {
      page: page ? parseInt(page) : 1,
      perPage: perPage ? parseInt(perPage) : 10,
      sort: sort ? { key: sort, sortDir: (sortDir as SortOrder) || SortOrder.ASC } : undefined,
    };
  }, [searchParams]);

  useEffect(() => {
    const c = cache<{
      items: GenericReturn<T>;
      totalItems: number;
    }>(cacheKey);
    console.log('ssss', searchParamValues);

    const key = `${Object.values(searchParamValues).map((i) => (i ? '-' + i : ''))}`;
    const valueFromCache = c.get(key);
    if (valueFromCache) {
      setObjects(valueFromCache.items);
      setTotal(valueFromCache.totalItems);
      return;
    }
    route(searchParamValues).then((r) => {
      setObjects(r.items);
      setTotal(r.totalItems);
      c.set(key, r);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamValues]);

  const totalPages = useMemo(() => Math.ceil(total / searchParamValues.perPage), [total, searchParamValues]);

  const pagesToShow: (number | string)[] = useMemo(
    () =>
      totalPages <= 7
        ? arrayRange(1, totalPages)
        : searchParamValues.page < 4
          ? [...arrayRange(1, 5), 'ellipsis', totalPages]
          : searchParamValues.page >= totalPages - 2
            ? [1, 'ellipsis', ...arrayRange(totalPages - 4, totalPages)]
            : [
                1,
                'ellipsis',
                ...arrayRange(searchParamValues.page - 1, searchParamValues.page + 1),
                'ellipsis',
                totalPages,
              ],
    [totalPages, searchParamValues],
  );

  return {
    Paginate: (
      <Stack>
        <Select
          value={ITEMS_PER_PAGE.find((i) => i.value === searchParamValues.perPage)?.value.toString()}
          onValueChange={(e) => {
            console.log('dpa', e);

            searchParams.set(SearchParamKey.PER_PAGE, e);
            setSearchParams(searchParams);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue color="red" placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {ITEMS_PER_PAGE.map((i) => (
              <SelectItem key={i.name} value={i.value.toString()}>
                {t(`perPage.${i.name}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Pagination>
          <PaginationContent>
            <PaginationPrevious
              isActive={searchParamValues.page !== 1}
              onClick={() => {
                searchParams.set(SearchParamKey.PAGE, (searchParamValues.page - 1).toString());
                setSearchParams(searchParams);
              }}
            />
            {pagesToShow.map((i, index) => (
              <PaginationItem
                key={index}
                className={cn('hidden', i !== (searchParamValues.page - 1).toString() && 'md:block')}
              >
                {i === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    isActive={i === searchParamValues.page}
                    onClick={() => {
                      searchParams.set(SearchParamKey.PAGE, i.toString());
                      setSearchParams(searchParams);
                    }}
                  >
                    {i}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationNext
              isActive={searchParamValues.page !== totalPages}
              onClick={() => {
                searchParams.set(SearchParamKey.PAGE, (searchParamValues.page + 1).toString());
                setSearchParams(searchParams);
              }}
            />
          </PaginationContent>
        </Pagination>
      </Stack>
    ),
    total,
    objects,
    sort: (sort: string, sortDir: SortOrder) => {
      searchParams.set(SearchParamKey.SORT, sort);
      searchParams.set(SearchParamKey.SORT_DIR, sortDir);
      setSearchParams(searchParams);
    },
  };
};
