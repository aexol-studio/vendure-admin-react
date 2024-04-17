import { Stack } from '@/components/Stack';
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
import { cache } from '@/lists/cache';
import { GenericReturn, PaginationInput, PromisePaginated } from '@/lists/models';
import { ModelTypes, SortOrder } from '@/zeus';
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
  // FILTER_PROMPT = 'filterPrompt',
  // FILTER_FIELD = 'filterField',
  FILTER = 'filter',
}

const arrayRange = (start: number, stop: number) =>
  Array.from({ length: stop - start + 1 }, (_, index) => start + index);

export type ListType = {
  products: 'ProductFilterParameter';
  collections: 'CollectionFilterParameter';
  orders: 'OrderFilterParameter';
  facets: 'FacetFilterParameter';
};

export const useList = <T extends PromisePaginated, K extends keyof ListType>({
  route,
  listType,
}: {
  route: T;
  listType: K;
}): {
  Paginate: JSX.Element;
  objects: GenericReturn<T> | undefined;
  total: number;
  setSort: (sort: string) => void;
  optionInfo: PaginationInput;
  resetFilter: () => void;
  setFilterField: (
    filterField: keyof ModelTypes[ListType[K]],
    fieldValue: ModelTypes[ListType[K]][keyof ModelTypes[ListType[K]]],
  ) => void;
  removeFilterField: (filterField: keyof ModelTypes[ListType[K]]) => void;
} => {
  const { t } = useTranslation('common');
  const [searchParams, setSearchParams] = useSearchParams();
  const [total, setTotal] = useState(0);
  const [objects, setObjects] = useState<GenericReturn<T>>();

  const setFilterField = (
    filterField: keyof ModelTypes[ListType[typeof listType]],
    fieldValue: ModelTypes[ListType[typeof listType]][typeof filterField],
  ) => {
    try {
      const filterURL = searchParams.get(SearchParamKey.FILTER);
      if (filterURL) {
        const filterFromParamsJSON = JSON.parse(filterURL) as ModelTypes[ListType[typeof listType]];
        searchParams.set(SearchParamKey.FILTER, JSON.stringify({ ...filterFromParamsJSON, [filterField]: fieldValue }));
        setSearchParams(searchParams);
      } else {
        searchParams.set(SearchParamKey.FILTER, JSON.stringify({ [filterField]: fieldValue }));
        setSearchParams(searchParams);
      }
    } catch (err) {
      throw new Error(`Parsing filter searchParams Key to JSON failed: ${err}`);
    }
  };

  const removeFilterField = (filterField: keyof ModelTypes[ListType[typeof listType]]) => {
    try {
      const filterURL = searchParams.get(SearchParamKey.FILTER);
      const filterFromParamsJSON = JSON.parse(filterURL || '') as ModelTypes[ListType[typeof listType]];
      delete filterFromParamsJSON[filterField];
      if (Object.keys(filterFromParamsJSON).length === 0) {
        searchParams.delete(SearchParamKey.FILTER);
      } else {
        searchParams.set(SearchParamKey.FILTER, JSON.stringify(filterFromParamsJSON));
      }
      setSearchParams(searchParams);
    } catch (err) {
      throw new Error(`Parsing filter searchParams Key to JSON failed: ${err}`);
    }
  };

  const resetFilter = () => {
    searchParams.delete(SearchParamKey.FILTER);
    setSearchParams(searchParams);
  };

  const searchParamValues: PaginationInput = useMemo(() => {
    const page = searchParams.get(SearchParamKey.PAGE);
    const perPage = searchParams.get(SearchParamKey.PER_PAGE);
    const sort = searchParams.get(SearchParamKey.SORT);
    const sortDir = searchParams.get(SearchParamKey.SORT_DIR);
    const filter = searchParams.get(SearchParamKey.FILTER);

    try {
      return {
        page: page ? parseInt(page) : 1,
        perPage: perPage ? parseInt(perPage) : 10,
        sort: sort && sortDir ? { key: sort, sortDir: sortDir as SortOrder } : undefined,
        filter: filter ? (JSON.parse(filter) as ModelTypes[ListType[typeof listType]]) : undefined,
      };
    } catch (err) {
      throw new Error(`Parsing filter searchParams Key to JSON failed: ${err}`);
    }
  }, [searchParams]);

  useEffect(() => {
    const c = cache<{
      items: GenericReturn<T>;
      totalItems: number;
    }>(listType);

    const key = searchParams.toString();
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
  const setSort = (sort: string) => {
    const currSort = searchParams.get(SearchParamKey.SORT);
    const currSortDir = searchParams.get(SearchParamKey.SORT_DIR);
    if (!currSort || !currSortDir) {
      searchParams.set(SearchParamKey.SORT, sort);
      searchParams.set(SearchParamKey.SORT_DIR, SortOrder.ASC);
    } else {
      if (sort === currSort) {
        if (currSortDir === SortOrder.ASC) {
          searchParams.set(SearchParamKey.SORT_DIR, SortOrder.DESC);
        } else if (currSortDir === SortOrder.DESC) {
          searchParams.delete(SearchParamKey.SORT);
          searchParams.delete(SearchParamKey.SORT_DIR);
        } else {
          searchParams.set(SearchParamKey.SORT, sort);
          searchParams.set(SearchParamKey.SORT_DIR, SortOrder.ASC);
        }
      } else {
        searchParams.set(SearchParamKey.SORT, sort);
        searchParams.set(SearchParamKey.SORT_DIR, SortOrder.ASC);
      }
    }
    setSearchParams(searchParams);
  };

  return {
    Paginate: (
      <Stack className="gap-4">
        <div className="whitespace-nowrap text-center m-auto">
          {(searchParamValues.page - 1) * searchParamValues.perPage + 1} -{' '}
          {searchParamValues.page * searchParamValues.perPage} of {total}
        </div>
        <div className="mx-auto">
          <Select
            value={ITEMS_PER_PAGE.find((i) => i.value === searchParamValues.perPage)?.value.toString()}
            onValueChange={(e) => {
              searchParams.set(SearchParamKey.PER_PAGE, e);
              searchParams.set(SearchParamKey.PAGE, '1');
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('perPagePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE.map((i) => (
                <SelectItem key={i.name} value={i.value.toString()}>
                  {t(`perPage.${i.name}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
    setSort,
    resetFilter,
    setFilterField,
    removeFilterField,
    optionInfo: searchParamValues,
  };
};
