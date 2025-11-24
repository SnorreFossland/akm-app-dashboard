import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
    id: string;
    name: string;
    description: string;
    color?: string; // Optional color property
    nameFrom?: string;
    nameTo?: string;
    // Add other relevant fields if necessary
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
    modelId?: string;
    onSelectionChange?: (selectedIds: string[]) => void;
}



export const RelshipTable: React.FC<RelshipTableProps> = ({ data, modelId, onSelectionChange }) => {
    const dispatch = useDispatch();

    // If modelId provided, prefer live relships from the store so UI reflects soft-deletes immediately
    const storeRelships = useSelector((state: any) => {
        try {
            return state?.modelUniverse?.phData?.metis?.models?.find((m: any) => m.id === modelId)?.relships ?? null;
        } catch (e) {
            return null;
        }
    });
    // Manage sorting state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pageSize, setPageSize] = React.useState(20); // Default page size
    const [pageIndex, setPageIndex] = React.useState(0); // Default page index

    // compute at render time using effectiveData (live store when available)
    const effectiveData = React.useMemo(() => {
        const src = Array.isArray(storeRelships) ? storeRelships : data || [];
        return src.map((r: any) => ({ ...r }));
    }, [storeRelships, data]);

    const typeColumnVisibleInitially = React.useMemo(
        () => effectiveData.some((d: any) => {
            const v = d.typeName ?? d.type ?? '';
            return String(v).trim().toLowerCase() !== 'n/a' && String(v).trim() !== '';
        }),
        [effectiveData]
    );

    const [showDeleted, setShowDeleted] = React.useState(false);
    const displayedData = React.useMemo(() => {
        if (!effectiveData) return [];
        return showDeleted ? effectiveData : effectiveData.filter((d: any) => !d.markedAsDeleted);
    }, [effectiveData, showDeleted]);

    const deletedCount = React.useMemo(() => {
        return Array.isArray(effectiveData) ? effectiveData.filter((d: any) => !!d.markedAsDeleted).length : 0;
    }, [effectiveData]);

    // Selection state for relationships
    const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(Object.keys(selectedIds));
        }
    }, [selectedIds, onSelectionChange]);
    const selectedCount = React.useMemo(() => Object.keys(selectedIds).length, [selectedIds]);
    const toggleSelection = (id: string, value?: boolean) => {
        setSelectedIds((prev) => {
            const next = { ...prev };
            if (value === undefined) {
                if (next[id]) delete next[id]; else next[id] = true;
            } else {
                if (value) next[id] = true; else delete next[id];
            }
            return next;
        });
    };
    const selectAll = (checked: boolean) => {
        if (checked) {
            const map: Record<string, boolean> = {};
            displayedData.forEach((d: any) => { if (d?.id) map[d.id] = true; });
            setSelectedIds(map);
        } else {
            setSelectedIds({});
        }
    };
    const allSelected = React.useMemo(() => {
        return displayedData.length > 0 && displayedData.every((d: any) => !!selectedIds[d.id]);
    }, [displayedData, selectedIds]);

    const deleteSelected = () => {
        if (selectedCount === 0) return;
        try {
            // eslint-disable-next-line no-restricted-globals
            const ok = confirm(`Delete ${selectedCount} selected relationships?`);
            if (!ok) return;
        } catch (e) { }
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { deleteRelship } = require('@/features/model-universe/modelSlice');
            Object.keys(selectedIds).forEach((id) => {
                dispatch(deleteRelship({ modelId: modelId ?? undefined, id }));
            });
            setSelectedIds({});
        } catch (e) {
            console.warn('Failed to dispatch deleteRelship for selected ids', e);
        }
    };

    const restoreSelected = () => {
        if (selectedCount === 0) return;
        try {
            // eslint-disable-next-line no-restricted-globals
            const ok = confirm(`Restore ${selectedCount} selected relationships?`);
            if (!ok) return;
        } catch (e) { }
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { restoreRelship } = require('@/features/model-universe/modelSlice');
            Object.keys(selectedIds).forEach((id) => {
                dispatch(restoreRelship({ modelId: modelId ?? undefined, id }));
            });
            setSelectedIds({});
        } catch (e) {
            console.warn('Failed to dispatch restoreRelship for selected ids', e);
        }
    };

    // Consider relships as duplicates if nameFrom, name, and nameTo are all equal
    const duplicateRelshipCount = React.useMemo(() => {
        const seen = new Set<string>();
        let duplicates = 0;
        (effectiveData || []).forEach((rel: any) => {
            const key = `${rel?.nameFrom ?? ''}|||${rel?.name ?? ''}|||${rel?.nameTo ?? ''}`;
            if (!rel?.nameFrom || !rel?.name || !rel?.nameTo) return;
            if (seen.has(key)) {
                duplicates += 1;
                return;
            }
            seen.add(key);
        });
        return duplicates;
    }, [effectiveData]);

    const removeDuplicateRelships = () => {
        if (duplicateRelshipCount === 0) {
            console.info('[RelshipTable] No duplicate relationship IDs detected.');
            return;
        }

        try {
            // eslint-disable-next-line no-restricted-globals
            const ok = confirm(`Remove ${duplicateRelshipCount} duplicate relationship${duplicateRelshipCount === 1 ? '' : 's'}?`);
            if (!ok) return;
        } catch (e) {
            // ignore
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { removeDuplicateRelships } = require('@/features/model-universe/modelSlice');
            dispatch(removeDuplicateRelships({ modelId: modelId ?? undefined }));
        } catch (e) {
            console.warn('Failed to dispatch removeDuplicateRelships action', e);
        }
    };

    // Actions are provided by the centralized ActionsCell in relship-columns.tsx

    const finalColumns = React.useMemo(() => {
        const selectionCol: ColumnDef<Relationship, any> = {
            id: 'select',
            header: () => (
                <Checkbox checked={allSelected} onCheckedChange={(v) => selectAll(!!v)} />
            ),
            cell: ({ row }) => {
                const id = (row.original as any)?.id;
                return (
                    <Checkbox checked={!!selectedIds[id]} onCheckedChange={(v) => toggleSelection(id, !!v)} />
                );
            }
        };

        const base = [selectionCol, ...columnsWithRowNumber.filter(c => c.id !== 'select') as ColumnDef<Relationship, any>[]];
        return base;
    }, [allSelected, selectedIds]);

    const table = useReactTable<Relationship>({
        data: displayedData,
        columns: finalColumns,
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
        <div className="m-1 w-full min-w-0">
            <div className="flex justify-between items-center w-full p-2 gap-2">
                <Input
                    placeholder="Filter..."
                    value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                    onChange={(event) =>
                        table.getColumn('name')?.setFilterValue(event.target.value)
                    }
                    className="text-[10px] h-6 max-w-sm px-2"
                    size="xs"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="text-[10px] px-1.5 py-0.5 rounded" size="xs">
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
                                    className="capitalize text-xs px-2 py-1"
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

                <div className="ml-auto flex items-center gap-2">
                    <div className="inline-flex items-center gap-2">
                        <span className="text-xs text-gray-400 space-x-1">
                            <span className=" whitespace-nowrap">{`${selectedCount} selected`}</span>
                            {' \n '}
                            <span className=" whitespace-nowrap">{displayedData.length} total</span>
                        </span>

                        <label className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Checkbox checked={showDeleted} onCheckedChange={(v) => setShowDeleted(!!v)} />
                            <span>Show deleted</span>
                        </label>
                        {duplicateRelshipCount > 0 && (
                            <Button
                                onClick={removeDuplicateRelships}
                                disabled={duplicateRelshipCount === 0}
                                size="xs"
                                className={`text-[10px] px-1.5 py-0.5 rounded  ${duplicateRelshipCount === 0 ? 'opacity-50 cursor-not-allowed bg-yellow-500 text-white' : 'bg-yellow-700 text-white hover:bg-yellow-600'}`}
                            >
                                Remove duplicates{duplicateRelshipCount > 0 ? ` (${duplicateRelshipCount})` : ''}
                            </Button>
                        )}
                        {selectedCount > 0 && (
                            <>
                                <Button
                                    onClick={restoreSelected}
                                    disabled={selectedCount === 0}
                                    size="xs"
                                    className={`text-[10px] px-1.5 py-0.5 rounded ${selectedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''} bg-green-800 text-white dark:bg-green-700 dark:text-white hover:bg-green-700`}
                                >
                                    Restore selected
                                </Button>
                                <Button
                                    onClick={deleteSelected}
                                    disabled={selectedCount === 0}
                                    size="xs"
                                    className={`text-[10px] px-1.5 py-0.5 rounded  ${selectedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''} bg-red-800 text-white dark:bg-red-700 dark:text-white hover:bg-red-700`}
                                >
                                    Delete selected
                                </Button>
                            </>
                        )}
                        {deletedCount > 0 && (
                            <Button
                                onClick={() => {
                                    try {
                                        // eslint-disable-next-line no-restricted-globals
                                        const ok = confirm(`Purge ${deletedCount} deleted relationship(s) and corresponding deleted objects for this model? This is permanent.`);
                                        if (!ok) return;
                                    } catch (e) { }
                                    try {
                                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                                        const { purgeModel } = require('@/features/model-universe/modelSlice');
                                        dispatch(purgeModel({ modelId: modelId ?? undefined } as any));
                                    } catch (e) {
                                        console.warn('Failed to dispatch purgeModel', e);
                                    }
                                }}
                                disabled={deletedCount === 0}
                                size="xs"
                                className={`text-[10px] px-1.5 py-0.5 rounded  ${deletedCount === 0 ? 'opacity-50 cursor-not-allowed bg-red-400' : 'bg-red-700 hover:bg-red-600'} text-white`}
                            >
                                Purge{deletedCount > 0 ? ` (${deletedCount})` : ''}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            {/* Render the table */}
            <div className="max-h-[calc(100vh-22rem)] text-sm w-full overflow-y-auto">
                <table className="min-w-full divide-y bg-background divide-gray-500">
                    <thead className="sticky top-0 bg-background">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className={
                                            `${(['rowActions', 'actions', 'select'].includes(header.column.id)
                                                ? 'w-9 min-w-[36px] max-w-[46px] px-1 py-2 text-center'
                                                : header.column.id === 'NameFrom' || header.column.id === 'NameTo'
                                                    ? 'w-56 max-w-[12rem] px-2 py-2 text-left truncate overflow-hidden'
                                                    : 'px-3 py-2 text-left')} text-xs font-medium text-gray-500 uppercase tracking-wider`
                                        }
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
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-3 py-1 break-words">
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
            </div>
            {/* Pagination */}
            <div className="flex justify-between items-center py-4 w-full">
                <Button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <span>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <div className="flex items-center gap-4">
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
        </div >
    );
};