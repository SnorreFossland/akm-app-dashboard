import React, { useState } from 'react';
import { ColumnDef, TableMeta } from '@tanstack/react-table';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    flexRender,
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
import { columns } from './object-columns'; // Ensure this is correctly typed

// Define the Concept type
interface Concept {
    id: string;
    name: string;
    description: string;
    color?: string; // Optional color property
}

interface ConceptTableProps {
    data: Concept[];
}

export interface ConceptTableMeta extends TableMeta<Concept> { // Exported Interface
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const rowNumberColumn: ColumnDef<Concept> = {
    id: 'rowNumber',
    header: '#',
    cell: (info) => info.row.index + 1,
};

const columnsWithRowNumber = [rowNumberColumn, ...columns];

export const ConceptTable: React.FC<ConceptTableProps> = ({ data }) => {
    // Manage sorting state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pageSize, setPageSize] = React.useState(20); // Default page size
    const [pageIndex, setPageIndex] = React.useState(0); // Default page index

    const onEdit = (id: string) => {
        console.log(`Edit concept with id: ${id}`);
        // Implement global edit logic if needed
    };

    const onDelete = (id: string) => {
        console.log(`Delete concept with id: ${id}`);
        // Your delete logic here, e.g., dispatch(deleteConcept(id))
    };

    const table = useReactTable<Concept>({
        data,
        columns: columnsWithRowNumber,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            pagination: { pageIndex, pageSize },
        },
        meta: {
            onEdit,
            onDelete,
        } as ConceptTableMeta,
        onSortingChange: setSorting,
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
            <table className="min-w-full divide-y bg-gray-800 divide-gray-500">
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
                                                    ? 'cursor-pointer select-none'
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
                <tbody className="bg-gray-700 divide-y divide-gray-500">
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="px-3 py-1">
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
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
                <select
                    className='bg-transparent'
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