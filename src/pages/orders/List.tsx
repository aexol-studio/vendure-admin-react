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
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PaginationInput } from '@/lists/models';
import { Badge, EmptyState, Input } from '@/components';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OrderStateBadge } from './_components/OrderStateBadge';
import { ColumnsVisibilityStoreType, columnsVisibilityStore } from '@/state';

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
    removeFilterField,
    resetFilter,
    setFilterField,
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

  return (
    <Stack column className="gap-6">
      <div className="page-content-h flex w-full flex-col">
        <div className="mb-4 flex flex-col items-end gap-4">
          <Button
            onClick={async () => {
              const id = await createDraftOrder();
              if (id) navigate(`/orders/${id}`);
              else console.error('Failed to create order');
            }}
          >
            {t('createOrder')}
          </Button>
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
          {/* <Search {...ordersSearchProps} /> */}
          <div className="flex gap-2">
            <Input onChange={(e) => setFilterField('customerLastName', { contains: e.target.value })} />
            <Button onClick={() => removeFilterField('customerLastName')}>Reset Field</Button>
            <Button onClick={() => resetFilter()}>reset filter</Button>
            <Button onClick={() => setFilterField('code', { contains: 'aa' })}>set filter</Button>
          </div>
        </div>
        <div className={`h-full w-full overflow-auto rounded-md border`}>
          <Table className="h-full w-full">
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
