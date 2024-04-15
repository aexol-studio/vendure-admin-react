import { adminApiQuery } from '@/common/client';
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
import React, { PropsWithChildren, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PaginationInput } from '@/lists/models';
import { Input, Search, ordersSearchProps } from '@/components';

const SortButton: React.FC<
  PropsWithChildren<{ key: string; currSort: PaginationInput['sort']; onClick: () => void }>
> = ({ currSort, onClick, children, key }) => {
  return (
    <Button variant="ghost" onClick={onClick}>
      {children}
      {currSort && currSort.key === key ? (
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

// const filterOrdersParameterOptions: {
//   key: keyof Pick<ValueTypes['OrderFilterParameter'], 'customerLastName' | 'transactionId' | 'id' | 'code'>;
//   type: 'StringOperators' | 'IDOperators';
// }[] = [
//   { key: 'customerLastName', type: 'StringOperators' },
//   { key: 'transactionId', type: 'StringOperators' },
//   { key: 'id', type: 'IDOperators' },
//   { key: 'code', type: 'StringOperators' },
// ] as const;

export const OrderListPage = () => {
  // const { t } = useTranslation('orders');

  const {
    objects: orders,
    Paginate,
    setSort,
    optionInfo,
    // setFilterPrompt,
    // setFilterField,
    // filterPrompt,
    // clearFilterPrompt,
    removeFilterField,
    resetFilter,
    setFilterField,
  } = useList({
    route: async ({ page, perPage, sort, filter }) => {
      // const filterObject =
      // filter &&
      // filter.field &&
      // filter.prompt &&
      // filter.prompt !== '' &&
      // filterOrdersParameterOptions.some((i) => i.key === filter.field)
      //   ? filterOrdersParameterOptions.find((i) => i.key === filter.field)?.key === 'id'
      //     ? ({ eq: filter.prompt } as ValueTypes['IDOperators'])
      //     : ({ contains: filter.prompt } as ValueTypes['StringOperators'])
      //   : undefined;

      return getOrders({
        take: perPage,
        skip: (page - 1) * perPage,
        ...(sort && { sort: { [sort.key]: sort.sortDir } }),
        ...(filter && { filter }),
        // ...(filter &&
        //   filter.field &&
        //   filter.prompt &&
        //   filter.prompt !== '' &&
        //   filterObject && { filter: { [filter.field]: filterObject } }),
      });
    },
    listType: 'orders',
  });

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
      header: 'id',
    },
    {
      accessorKey: 'firstName',
      header: 'firstName',
      cell: ({ row }) => <div className="capitalize">{row.original.customer?.firstName}</div>,
    },
    {
      accessorKey: 'lastName',
      header: () => (
        <SortButton currSort={optionInfo.sort} key="code" onClick={() => setSort('customerLastName')}>
          Last name
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
      accessorKey: 'fullName',
      header: 'fullName',
      cell: ({ row }) => <div className="capitalize">{row.original.shippingAddress?.fullName}</div>,
    },

    {
      accessorKey: 'code',
      header: () => (
        <SortButton currSort={optionInfo.sort} key="code" onClick={() => setSort('code')}>
          Code
        </SortButton>
      ),
    },

    {
      accessorKey: 'createdAt',
      header: 'created at',
      cell: ({ row }) => (
        <div className="text-nowrap">{format(new Date(row.original.createdAt), 'dd.MM.yyyy hh:mm')}</div>
      ),
    },
    {
      accessorKey: 'orderPlacedAt',
      header: 'orderPlacedAt',
      cell: ({ row }) => (
        <div className="text-nowrap">
          {row.original.orderPlacedAt ? format(new Date(row.original.orderPlacedAt), 'dd.MM.yyyy hh:mm') : ''}
        </div>
      ),
    },
    {
      accessorKey: 'shipping',
      header: 'shipping',
    },
    {
      accessorKey: 'state',
      header: 'state',
    },

    {
      accessorKey: 'type',
      header: 'type',
    },
    {
      accessorKey: 'updatedAt',
      header: 'updatedAt',
      cell: ({ row }) => (
        <div className="text-nowrap">{format(new Date(row.original.updatedAt), 'dd.MM.yyyy hh:mm')}</div>
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
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

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
      <div className="w-full">
        <div className="flex items-center py-4 gap-4">
          {/* <Input
            disabled={!optionInfo.filter?.field}
            placeholder="Filter codes..."
            value={filterPrompt}
            onChange={(event) => setFilterPrompt(event.target.value)}
            className="max-w-sm"
          />
          <Select
            value={optionInfo.filter?.field}
            onValueChange={(e) => {
              e === 'none' ? clearFilterPrompt() : setFilterField(e);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filterPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t(`noFilterField`)}</SelectItem>
              {filterOrdersParameterOptions.map((i) => (
                <SelectItem key={i.key} value={i.key}>
                  {t(`filterField.${i.key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}

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
        </div>
        <Search {...ordersSearchProps} />
        <Input onChange={(e) => setFilterField('customerLastName', { contains: e.target.value })} />
        <Button onClick={() => removeFilterField('customerLastName')}>Reset Field</Button>
        <Button onClick={() => resetFilter()}>reset filter</Button>
        <Button onClick={() => setFilterField('code', { contains: 'dddddupa' })}>set filter</Button>

        <div className="rounded-md border border-white  ">
          <Table>
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
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
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
