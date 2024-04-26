import { adminApiMutation, adminApiQuery } from '@/common/client';
import { Stack } from '@/components/Stack';
import { Button } from '@/components/ui/button';
import { OrderListSelector, OrderListType } from '@/graphql/orders';
import { useList } from '@/lists/useList';
import { ResolverInputTypes, SortOrder } from '@/zeus';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, MoreHorizontal, ArrowRight } from 'lucide-react';
import React, { PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PaginationInput } from '@/lists/models';
import { Badge, EmptyState, Search, ordersSearchProps } from '@/components';
import { Link, useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OrderStateBadge } from './_components/OrderStateBadge';
import { ColumnsVisibilityStoreType, columnsVisibilityStore } from '@/state';
import { OrdersSortOptions, ordersSortOptionsArray } from '@/lists/types';

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
  const response = await adminApiMutation()({
    createDraftOrder: { id: true },
  });
  return response.createDraftOrder.id;
};

const getOrders = async (options: ResolverInputTypes['OrderListOptions']) => {
  const response = await adminApiQuery()({
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
  const columnsVisibilityState = columnsVisibilityStore((state: ColumnsVisibilityStoreType) => state.orders);
  const setColumnsVisibilityState = columnsVisibilityStore((state: ColumnsVisibilityStoreType) => state.setOrders);
  const {
    objects: orders,
    Paginate,
    setSort,
    optionInfo,
    setFilterField,
    resetFilter,
    isFilterOn,
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

  const tableWrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const PADDING_X_VALUE = 64;
    setTimeout(() => {
      if (tableWrapperRef.current) {
        const wrapperWidth = document.getElementById('scrollArea')?.getBoundingClientRect().width;
        if (wrapperWidth) tableWrapperRef.current.style.maxWidth = wrapperWidth - PADDING_X_VALUE + 'px';
      }
    }, 0);
  }, [tableWrapperRef]);

  //make and array of columns based on passed type

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
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="code" onClick={() => setSort('id')}>
          ID
        </SortButton>
      ),
      cell: ({ row }) => {
        const to = `/orders/${row.original.id}`;
        return (
          <Link to={to} className="text-primary-600">
            <Badge variant="outline" className="flex w-full items-center justify-center">
              {row.original.id}
              <ArrowRight className="pl-1" size={16} />
            </Badge>
          </Link>
        );
      },
    },
    {
      accessorKey: 'state',
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="state" onClick={() => setSort('state')}>
          State
        </SortButton>
      ),
      cell: ({ row }) => <OrderStateBadge fullWidth state={row.original.state} />,
    },
    {
      accessorKey: 'firstName',
      header: () => <div>Customer First name</div>,
      cell: ({ row }) => <div className="capitalize">{row.original.customer?.firstName}</div>,
    },
    {
      accessorKey: 'lastName',
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="code" onClick={() => setSort('customerLastName')}>
          Customer Last name
        </SortButton>
      ),
      cell: ({ row }) => <div className="capitalize">{row.original.customer?.lastName}</div>,
    },
    {
      accessorKey: 'emailAddress',
      header: 'emailAddress',
      cell: ({ row }) => <div className="capitalize">{row.original.customer?.emailAddress}</div>,
    },
    {
      accessorKey: 'phoneNumber',
      header: 'phoneNumber',
      cell: ({ row }) => <div className="capitalize">{row.original.customer?.phoneNumber}</div>,
    },
    {
      accessorKey: 'code',
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="code" onClick={() => setSort('code')}>
          Code
        </SortButton>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="createdAt" onClick={() => setSort('createdAt')}>
          Created at
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
          Order Placed At
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
          Shipping
        </SortButton>
      ),
    },
    {
      accessorKey: 'type',
      header: 'type',
    },
    {
      accessorKey: 'updatedAt',
      cell: ({ row }) => (
        <div className="text-nowrap">{format(new Date(row.original.updatedAt), 'dd.MM.yyyy hh:mm')}</div>
      ),
      header: () => (
        <SortButton currSort={optionInfo.sort} sortKey="updatedAt" onClick={() => setSort('updatedAt')}>
          Updated at
        </SortButton>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
                Copy payment ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
              <DropdownMenuItem>
                <Link to={`/orders/${row.original.id}`} className="text-primary-600">
                  View order
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(columnsVisibilityState);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => setColumnsVisibilityState(columnVisibility), [columnVisibility, setColumnsVisibilityState]);

  const table = useReactTable({
    data: orders || [],
    manualPagination: true,
    columns,
    // onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,

    state: {
      // sorting,
      columnFilters,
      columnVisibility,
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

    filters.forEach((f) => setFilterField(f[0], f[1]));
  }, [searchParams, setFilterField]);

  const handleSearchChange = (value: string) => {
    setFilterField('customerLastName', { contains: value });
  };

  return (
    <Stack column className="gap-6">
      <div className="page-content-h flex w-full flex-col">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
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
            <Search {...ordersSearchProps} searchFilterField={handleSearchChange} />
            <Button onClick={() => resetFilter()}>Reset filters</Button>
            {/* <Input onChange={(e) => setFilterField('customerLastName', { contains: e.target.value })} /> */}
            {/* <Button onClick={() => removeFilterField('customerLastName')}>Reset Field</Button>
            <Button onClick={() => setFilterField('code', { contains: 'dddddupa' })}>set filter</Button> */}
          </div>
          <div>
            <Button
              onClick={async () => {
                const id = await createDraftOrder();
                if (id) navigate(`/orders/${id}`);
                else console.error('Failed to create order');
              }}
            >
              {t('createOrder')}
            </Button>
          </div>
        </div>
        <div ref={tableWrapperRef} className={`h-full overflow-auto rounded-md border`}>
          <Table className="w-full" {...(!table.getRowModel().rows?.length && { containerClassName: 'flex' })}>
            <TableHeader>
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
      </div>
    </Stack>
  );
};
