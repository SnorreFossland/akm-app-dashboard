import React from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel, // Import for sorted row model
    SortingState, // Import for sorting state
    flexRender,
    ColumnDef,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { columns } from './relship-columns'; // Ensure this is correctly typed

// Define the Relationship type based on your data structure
interface Relationship {
    name: string;
    nameFrom: string;
    nameTo: string;
    description: string;
    color?: string;
}

// Add a row number column
const rowNumberColumn: ColumnDef<Relationship> = {
    id: 'rowNumber',
    header: '#',
    cell: (info) => info.row.index + 1,
};

// Ensure the row number column is included in the columns array
const columnsWithRowNumber: ColumnDef<Relationship, any>[] = [rowNumberColumn, ...columns as ColumnDef<Relationship, any>[]];

interface RelshipTableProps {
    data: Relationship[];
    highlightRel?: { name: string; nameFrom: string; nameTo: string } | null;
    selectedRels?: { name: string; nameFrom: string; nameTo: string }[] | null;
    onSelect?: (rel: { name: string; nameFrom: string; nameTo: string }) => void;
}

export const RelshipTable: React.FC<RelshipTableProps> = ({ data, highlightRel, selectedRels = [], onSelect }) => {
    // Manage sorting state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pageSize, setPageSize] = React.useState(20); // Default page size
    const [pageIndex, setPageIndex] = React.useState(0); // Default page index

    // compute at render time
    const typeColumnVisibleInitially = React.useMemo(
        () => data.some((d: any) => {
            const v = d.typeName ?? d.type ?? '';
            return String(v).trim().toLowerCase() !== 'n/a' && String(v).trim() !== '';
        }),
        [data]
    );

    const table = useReactTable<Relationship>({
        data,
        columns: columnsWithRowNumber,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(), // Enable sorted row model
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            sorting, // Connect sorting state
            pagination: {
                pageIndex,
                pageSize,
            },
        },
        initialState: {
            columnVisibility: {
                // hide by default
                id: false,
                rowNumber: false,
                typeName: typeColumnVisibleInitially, // set based on data
            },
        },
        onSortingChange: setSorting, // Handle sorting changes
        onPaginationChange: (updater) => {
            const newState = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
            setPageIndex(newState.pageIndex);
            setPageSize(newState.pageSize);
        },
    });

    return (
        <div className="m-1">
            <div className="flex items-center p-2">
                <Input
                    placeholder="Filter..."
                    value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                    onChange={(event) =>
                        table.getColumn('name')?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) =>
                                        column.toggleVisibility(!!value)
                                    }
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {/* Render the table */}
            <table className="min-w-full divide-y bg-background divide-gray-500">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {header.isPlaceholder ? null : (
                                        <div
                                            {...{
                                                className: header.column.getCanSort()
                                                    ? 'cursor-pointer select-none flex items-center'
                                                    : '',
                                                onClick: header.column.getToggleSortingHandler(),
                                            }}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            {{
                                                asc: ' 🔼',
                                                desc: ' 🔽',
                                            }[header.column.getIsSorted() as string] ?? null}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="bg-background divide-y divide-gray-500">
                    {table.getRowModel().rows.map((row) => {
                        const lkey = `${(row.original.name || '').trim().toLowerCase()}|${(row.original.nameFrom || '').trim().toLowerCase()}|${(row.original.nameTo || '').trim().toLowerCase()}`;
                        const singleHighlighted = !!highlightRel &&
                          (row.original.name || '').trim().toLowerCase() === (highlightRel?.name || '').trim().toLowerCase() &&
                          (row.original.nameFrom || '').trim().toLowerCase() === (highlightRel?.nameFrom || '').trim().toLowerCase() &&
                          (row.original.nameTo || '').trim().toLowerCase() === (highlightRel?.nameTo || '').trim().toLowerCase();
                        const multiHighlighted = (selectedRels || []).some(r => `${(r?.name||'').trim().toLowerCase()}|${(r?.nameFrom||'').trim().toLowerCase()}|${(r?.nameTo||'').trim().toLowerCase()}` === lkey);
                        const isHighlighted = singleHighlighted || multiHighlighted;
                        return (
                        <tr key={row.id} className={isHighlighted ? 'bg-amber-900/40' : ''} onClick={() => onSelect?.({ name: row.original.name, nameFrom: row.original.nameFrom, nameTo: row.original.nameTo })}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="px-3 py-1">
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                        </tr>
                    )})}
                </tbody>
            </table>
            {/* Pagination */}
            <div className="flex justify-between items-center py-4">
                <Button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <span>
                    Page {table.getState().pagination.pageIndex + 1} of{' '}
                    {table.getPageCount()}
                </span>
                <select className='bg-transparent'
                    value={pageSize}
                    onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        table.setPageSize(Number(e.target.value));
                    }}
                >
                    {[10, 20, 30, 40, 50].map((size) => (
                        <option key={size} value={size}>
                            Show {size} rows
                        </option>
                    ))}
                </select>
                <Button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};
