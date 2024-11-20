// src/components/aiBuilders/concept-table.tsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store'; // Adjust the import path accordingly
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    ColumnDef,
    SortingState
} from '@tanstack/react-table';
import { deleteConcept } from '@/features/ontology/ontologySlice';
import ActionsCell from './ActionsCell';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
    TableHead,
    TableContainer
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { getColumns } from './concept-columns';

// Define the Concept type
interface Concept {
    id: string;
    name: string;
    description: string;
    color?: string;
}

// Define rowNumberColumn
const rowNumberColumn: ColumnDef<Concept> = {
    id: 'rowNumber',
    header: '#',
    cell: (info) => info.row.index + 1,
};

const ConceptTable: React.FC = () => {
    const dispatch = useDispatch();

    // Manage sorting and pagination state
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pageSize, setPageSize] = useState<number>(20); // Default page size
    const [pageIndex, setPageIndex] = useState<number>(0); // Default page index
    const [editingRowId, setEditingRowId] = useState<string | null>(null);

    // Fetch data from Redux store
    const data = useSelector((state: RootState) => state.ontology.concepts) || [];

    // Define columns
    const columns = getColumns(editingRowId, setEditingRowId, handleDelete);
    const columnsWithRowNumber = [rowNumberColumn, ...columns];

    // Initialize the table instance
    const table = useReactTable<Concept>({
        data,
        columns: columnsWithRowNumber,
        state: {
            sorting,
            pagination: {
                pageSize,
                pageIndex,
            },
        },
        onSortingChange: setSorting,
        onPaginationChange: ({ pageSize, pageIndex }) => {
            setPageSize(pageSize);
            setPageIndex(pageIndex);
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: false, // Set to true if pagination is handled server-side
    });

    const handleEdit = (id: string) => {
        console.log(`Edit concept with id: ${id}`);
        setEditingRowId(id);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this concept?')) {
            dispatch(deleteConcept(id));
        }
    };

    return (
        <TableContainer>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder ? null : header.renderHeader()}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map(row => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id}>
                                        {cell.renderCell()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columnsWithRowNumber.length}>
                                No concepts found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* Add pagination controls here if needed */}
            <div className="flex items-center justify-between py-4">
                <div className="flex-1 flex justify-start">
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPageIndex(0); // Reset to first page
                        }}
                        className="border rounded px-2 py-1"
                    >
                        {[10, 20, 30, 40, 50].map((size) => (
                            <option key={size} value={size}>
                                Show {size}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 flex justify-end">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="border rounded px-2 py-1 mr-2"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="border rounded px-2 py-1"
                    >
                        Next
                    </button>
                </div>
            </div>
        </TableContainer>
    );
};

export default ConceptTable;