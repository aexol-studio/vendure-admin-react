import { apiCall } from '@/graphql/client';
import { Stack } from '@/components/Stack';
import { Button } from '@/components/ui/button';
import { OrderListSelector, OrderListType } from '@/graphql/orders';
import { useList } from '@/lists/useList';
import { DeletionResult, ResolverInputTypes, SortOrder } from '@/zeus';
import { format } from 'date-fns';
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, MoreHorizontal, ArrowRight, Copy } from 'lucide-react';
import React, { PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PaginationInput } from '@/lists/models';
import {
  Badge,
  EmptyState,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Search,
  ordersSearchProps,
} from '@/components';
import { Link, useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OrderStateBadge } from './_components/OrderStateBadge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { OrdersSortOptions, ordersSortOptionsArray } from '@/lists/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Routes } from '@/utils';

type ParamFilterFieldTuple = [OrdersSortOptions, Record<string, string>];

const SortButton: React.FC<
  PropsWithChildren<{ sortKey: string; currSort: PaginationInput['sort']; onClick: () => void }>
> = ({ currSort, onClick, children, sortKey }) => {
  return (
    <Button variant="ghost" onClick={onClick}>
      {children}
      {currSort && currSort.key === sortKey ? (
        currSort.sortDir === SortOrder.ASC ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
};

const createDraftOrder = async () => {
  const response = await apiCall('mutation')({
    createDraftOrder: { id: true },
  });
  return response.createDraftOrder.id;
};

const getOrders = async (options: ResolverInputTypes['OrderListOptions']) => {
  const response = await apiCall('query')({
    orders: [
      { options },
      {
        totalItems: true,
        items: OrderListSelector,
      },
    ],
  });
  return response.orders;
};

export const OrderListPage = () => {
  const { t } = useTranslation('orders');
  const navigate = useNavigate();

  const [columnsVisibilityState, setColumnsVisibilityState] = useLocalStorage<VisibilityState>(
    'orders-table-visibility',
    {},
  );

  const {
    objects: orders,
    Paginate,
    setSort,
    optionInfo,
    setFilterField,
    resetFilter,
    isFilterOn,
    refetch: refetchOrders,
  } = useList({
    route: async ({ page, perPage, sort, filter }) => {
      return getOrders({
        take: perPage,
        skip: (page - 1) * perPage,
        ...(sort && { sort: { [sort.key]: sort.sortDir } }),
        ...(filter && { filter }),
      });
    },
    listType: 'orders',
  });
  const [ordersToDelete, setOrdersToDelete] = useState<OrderListType[]>([]);
  const [deleteDialogOpened, setDeleteDialogOpened] = useState(false);

  const tableWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const PADDING_X_VALUE = 64;
    const updateSize = () => {
      setTimeout(() => {
        if (tableWrapperRef.current) {
          const wrapperWidth = document.getElementById('scrollArea')?.getBoundingClientRect().width;
          if (wrapperWidth) tableWrapperRef.current.style.maxWidth = wrapperWidth - PADDING_X_VALUE + 'px';
        }
      }, 0);
    };

    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [tableWrapperRef]);

  const deleteOrdersToDelete = async () => {
    const resp = await Promise.all(
      ordersToDelete.map((i) =>
        apiCall('mutation')({ deleteDraftOrder: [{ orderId: i.id }, { message: true, result: true }] }),
      ),
    );
    resp.forEach((i) =>
      i.deleteDraftOrder.result === DeletionResult.NOT_DELETED
        ? toast.error(i.deleteDraftOrder.message)
        : toast(i.deleteDraftOrder.message || 'Order deleted'),
    );
    refetchOrders();
    setDeleteDialogOpened(false);
    setOrdersToDelete([]);
  };

  const columns: ColumnDef<OrderListType>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} />
      ),
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'id',
      enableHiding: false,
      enableColumnFilter: false,
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="code" onClick={() => setSort('id')}>
          {t('table.id')}
        </SortButton>
      ),
      cell: ({ row }) => (
        <Link to={Routes.order.to(row.original.id)} className="text-primary-600">
          <Badge variant="outline" className="flex w-full items-center justify-center">
            {row.original.id}
            <ArrowRight className="pl-1" size={16} />
          </Badge>
        </Link>
      ),
    },
    {
      accessorKey: 'state',
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="state" onClick={() => setSort('state')}>
          {t('table.state')}
        </SortButton>
      ),
      cell: ({ row }) => <OrderStateBadge state={row.original.state} />,
    },
    {
      accessorKey: 'firstName',
      header: () => <div> {t('table.firstName')}</div>,
      cell: ({ row }) => <div className="capitalize">{row.original.customer?.firstName}</div>,
    },
    {
      accessorKey: 'lastName',
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="code" onClick={() => setSort('customerLastName')}>
          {t('table.lastName')}
        </SortButton>
      ),
      cell: ({ row }) => <div className="capitalize">{row.original.customer?.lastName}</div>,
    },
    {
      accessorKey: 'emailAddress',
      header: t('table.emailAddress'),
      cell: ({ row }) => (
        <HoverCard openDelay={100}>
          <HoverCardTrigger asChild>
            <div className="max-w-[200px] truncate">{row.original.customer?.emailAddress}</div>
          </HoverCardTrigger>
          <HoverCardContent className="flex w-auto flex-shrink items-center justify-between gap-4">
            {row.original.customer?.emailAddress}{' '}
            <Copy
              className="cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(row.original.customer?.emailAddress || '');
                toast.info(t('copied'), { position: 'top-center' });
              }}
            />
          </HoverCardContent>
        </HoverCard>
      ),
    },
    {
      accessorKey: 'phoneNumber',
      header: t('table.phoneNumber'),
      cell: ({ row }) => <div className="text-nowrap">{row.original.customer?.phoneNumber}</div>,
    },
    {
      accessorKey: 'code',
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="code" onClick={() => setSort('code')}>
          {t('table.code')}
        </SortButton>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="createdAt" onClick={() => setSort('createdAt')}>
          {t('table.createdAt')}
        </SortButton>
      ),
      cell: ({ row }) => (
        <div className="text-nowrap">{format(new Date(row.original.createdAt), 'dd.MM.yyyy hh:mm')}</div>
      ),
    },
    {
      accessorKey: 'orderPlacedAt',
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="orderPlacedAt" onClick={() => setSort('orderPlacedAt')}>
          {t('table.placedAt')}
        </SortButton>
      ),
      cell: ({ row }) => (
        <div className="text-nowrap">
          {row.original.orderPlacedAt ? format(new Date(row.original.orderPlacedAt), 'dd.MM.yyyy hh:mm') : ''}
        </div>
      ),
    },
    {
      accessorKey: 'shipping',
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="shipping" onClick={() => setSort('shipping')}>
          {t('table.shipping')}
        </SortButton>
      ),
    },
    {
      accessorKey: 'type',
      header: t('table.type'),
    },
    {
      accessorKey: 'updatedAt',
      cell: ({ row }) => (
        <div className="text-nowrap">{format(new Date(row.original.updatedAt), 'dd.MM.yyyy hh:mm')}</div>
      ),
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="updatedAt" onClick={() => setSort('updatedAt')}>
          {t('table.updatedAt')}
        </SortButton>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t('table.openMenu')}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('table.actions')}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
              {t('table.copyId')}
            </DropdownMenuItem>
            {row.original.state === 'Draft' && (
              <DropdownMenuItem
                onClick={() => {
                  setDeleteDialogOpened(true);
                  setOrdersToDelete([row.original]);
                }}
              >
                {t('table.deleteDraft')}
              </DropdownMenuItem>
            )}
            {row.original.state !== 'Draft' && row.original.state !== 'Cancelled' && (
              <DropdownMenuItem
                onClick={() => {
                  setDeleteDialogOpened(true);
                  setOrdersToDelete([row.original]);
                }}
              >
                {t('create.cancelOrder')}
              </DropdownMenuItem>
            )}
            {row.original.customer?.id && (
              <DropdownMenuItem>
                <Link to={Routes.customer.to(row.original.customer.id)}>{t('table.viewCustomer')}</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Link to={Routes.order.to(row.original.id)} className="text-primary-600">
                {t('table.viewOrder')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: orders || [],
    manualPagination: true,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnsVisibilityState,
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      columnVisibility: columnsVisibilityState,
      rowSelection,
      pagination: { pageIndex: optionInfo.page, pageSize: optionInfo.perPage },
    },
  });

  const [searchParams] = useSearchParams();

  useEffect(() => {
    let filterObj = {};
    const filters: Array<ParamFilterFieldTuple> = [];

    ordersSortOptionsArray.forEach((p) => {
      if (searchParams.has(p)) {
        const param = searchParams.get(p);

        if (param) {
          const [paramVal, paramKey] = param.split(',');
          const paramFilterField = { [paramKey]: paramVal };
          const paramFilterTuple: ParamFilterFieldTuple = [p, paramFilterField];
          filters.push(paramFilterTuple);
        }

        filterObj = {
          ...filterObj,
          [p]: searchParams.get(p),
        };
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.forEach((f) => setFilterField(f[0] as any, f[1]));
  }, [searchParams, setFilterField]);

  const handleSearchChange = (value: string) => {
    setFilterField('customerLastName', { contains: value });
  };

  return (
    <Stack column className="gap-6">
      <div className="page-content-h flex w-full flex-col">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="flex gap-2">
            <Search {...ordersSearchProps} searchFilterField={handleSearchChange} />
            <Button onClick={() => resetFilter()}>Reset filters</Button>
            {/* <Input onChange={(e) => setFilterField('customerLastName', { contains: e.target.value })} /> */}
            {/* <Button onClick={() => removeFilterField('customerLastName')}>Reset Field</Button>
            <Button onClick={() => setFilterField('code', { contains: 'dddddupa' })}>set filter</Button> */}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                const id = await createDraftOrder();
                if (id) navigate(Routes.order.to(id));
                else console.error('Failed to create order');
              }}
            >
              {t('createOrder')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  {t('columns')} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div ref={tableWrapperRef} className={`h-full overflow-auto rounded-md border`}>
          <Table className="w-full" {...(!table.getRowModel().rows?.length && { containerClassName: 'flex' })}>
            <TableHeader className="sticky top-0 bg-primary-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <EmptyState columnsLength={columns.length} filtered={isFilterOn} />
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
            selected.
          </div>
          <div className="space-x-2">{Paginate}</div>
        </div>
        <Dialog open={deleteDialogOpened} onOpenChange={setDeleteDialogOpened}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle> {t('deleteDraft.title')}</DialogTitle>
              <DialogDescription>{t('deleteDraft.description')}</DialogDescription>
              <DialogDescription>
                {ordersToDelete.map((i) => (
                  <div>
                    {i.id} {i.code} {i.customer?.firstName} {i.customer?.firstName} {i.customer?.emailAddress}
                  </div>
                ))}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button>{t('deleteDraft.cancel')}</Button>
              </DialogClose>
              <Button onClick={deleteOrdersToDelete}>{t('deleteDraft.confirm')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Stack>
  );
};
