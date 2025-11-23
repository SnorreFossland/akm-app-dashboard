import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

// Define the Object type (kept as in original file)
interface Object {
    id: string;
    name: string;
    description: string;
    color?: string; // Optional color property
    typeName: string;
    typeId: string;
    proposedType: string;
    // optional UI flags
    modified?: boolean;
    markedAsDeleted?: boolean;
}

interface ObjectTableProps {
    data: Object[];
    // optional model id so delete/restore target the correct model when table is used standalone
    modelId?: string;
    onSelectionChange?: (selectedIds: string[]) => void;
}

export interface ObjectTableMeta extends TableMeta<Object> { // Exported Interface
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onRestore?: (id: string) => void;
}

const rowNumberColumn: ColumnDef<Object, any> = {
    id: 'rowNumber',
    header: '#',
    cell: (info) => info.row.index + 1,
};

// Selection column for selecting rows (select all + per-row)
const selectionColumn: ColumnDef<Object, any> = {
    id: 'select',
    header: ({ table }) => {
        // keep header compact: use a small fixed-width container to counter the th padding
        return (
            // use Tailwind width (w-9 ~= 36px) so sizing is controlled via classes
            <div className="w-9 flex items-center justify-center">
                <span />
            </div>
        );
    },
    cell: (info) => {
        // compact per-row checkbox is rendered in finalColumns so cell placeholder kept minimal
        return <span />;
    }
};

const columnsWithRowNumberBase: ColumnDef<Object, any>[] = [selectionColumn, rowNumberColumn, ...(columns as ColumnDef<Object, any>[])];

// Actions column removed here; ActionsCell from `object-columns.tsx` provides the actions column centrally.
export const ObjectTable: React.FC<ObjectTableProps> = ({ data, modelId, onSelectionChange }) => {
    const dispatch = useDispatch();

    // If a modelId is provided prefer reading the live objects from the redux store so
    // the table always reflects the authoritative state (avoids stale prop copies).
    const storeObjects = useSelector((state: any) => {
        try {
            return state?.modelUniverse?.phData?.metis?.models?.find((m: any) => m.id === modelId)?.objects ?? null;
        } catch (e) {
            return null;
        }
    });

    // Manage sorting state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pageSize, setPageSize] = React.useState(20); // Default page size
    const [pageIndex, setPageIndex] = React.useState(0); // Default page index
    const [showDeleted, setShowDeleted] = useState(false);

    const onEdit = (id: string) => {
        console.log(`Edit Object with id: ${id}`);
        // Implement global edit logic if needed
    };

    const onDelete = (id: string) => {
        try {
            // eslint-disable-next-line no-restricted-globals
            const ok = confirm(`Delete this object? (id: ${id})`);
            if (!ok) return;
        } catch (e) {
            // In non-browser/test environments, skip confirm
        }
        console.log(`Delete Object with id: ${id}`);
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { deleteObject } = require('@/features/model-universe/modelSlice');
            // dispatch with modelId when available so the slice updates the correct model
            dispatch(deleteObject({ modelId: modelId ?? undefined, id }));
        } catch (e) {
            console.warn('Failed to dispatch deleteObject action', e);
        }
    };

    const onRestore = (id: string) => {
        console.log(`Restore Object with id: ${id}`);
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { restoreObject } = require('@/features/model-universe/modelSlice');
            dispatch(restoreObject({ modelId: modelId ?? undefined, id }));
        } catch (e) {
            console.warn('Failed to dispatch restoreObject action', e);
        }
    };

    // compute at render time (use effectiveData below)

    // Build an effective data source: prefer storeObjects (live) when modelId is supplied,
    // otherwise fall back to the data prop. Normalize typeId/typeName for columns.
    const effectiveData = React.useMemo(() => {
        const src = Array.isArray(storeObjects) ? storeObjects : data || [];
        return src.map((o: any) => ({
            ...o,
            typeId: o.typeRef ?? o.typeId,
            typeName: o.typeName ?? o.proposedType ?? o.typeRef ?? o.typeName ?? '',
        }));
    }, [storeObjects, data]);

    const typeColumnVisibleInitially = React.useMemo(
        () => effectiveData.some((d: any) => {
            const v = d.typeName ?? d.type ?? '';
            return String(v).trim().toLowerCase() !== 'n/a' && String(v).trim() !== '';
        }),
        [effectiveData]
    );

    // Filter out deleted objects by default
    const displayedData = React.useMemo(() => {
        if (!effectiveData) return [];
        return showDeleted ? effectiveData : effectiveData.filter((d: any) => !d.markedAsDeleted);
    }, [effectiveData, showDeleted]);

    // Count of items marked as deleted (for purge button)
    const deletedCount = React.useMemo(() => {
        return Array.isArray(effectiveData) ? effectiveData.filter((d: any) => !!d.markedAsDeleted).length : 0;
    }, [effectiveData]);
    // Selection state for rows (ids)
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
            const ok = confirm(`Delete ${selectedCount} selected objects?`);
            if (!ok) return;
        } catch (e) {
            // ignore confirm failure in non-browser env
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { deleteObject } = require('@/features/model-universe/modelSlice');
            Object.keys(selectedIds).forEach((id) => {
                dispatch(deleteObject({ modelId: modelId ?? undefined, id }));
            });
            // clear selection after deletion
            setSelectedIds({});
        } catch (e) {
            console.warn('Failed to dispatch deleteObject for selected ids', e);
        }
    };

    const restoreSelected = () => {
        if (selectedCount === 0) return;
        try {
            // eslint-disable-next-line no-restricted-globals
            const ok = confirm(`Restore ${selectedCount} selected objects?`);
            if (!ok) return;
        } catch (e) {
            // ignore
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { restoreObject } = require('@/features/model-universe/modelSlice');
            Object.keys(selectedIds).forEach((id) => {
                dispatch(restoreObject({ modelId: modelId ?? undefined, id }));
            });
            // clear selection after restore
            setSelectedIds({});
        } catch (e) {
            console.warn('Failed to dispatch restoreObject for selected ids', e);
        }
    };

    // Consider objects as duplicates if name and description are equal
    const duplicateIdCount = React.useMemo(() => {
        const seen = new Set<string>();
        let duplicates = 0;
        (effectiveData || []).forEach((obj: any) => {
            const key = `${obj?.name ?? ''}|||${obj?.description ?? ''}`;
            if (!obj?.name || !obj?.description) return;
            if (seen.has(key)) {
                duplicates += 1;
                return;
            }
            seen.add(key);
        });
        return duplicates;
    }, [effectiveData]);

    const removeDuplicateEntries = () => {
        if (duplicateIdCount === 0) {
            console.info('[ObjectTable] No duplicate IDs detected.');
            return;
        }

        try {
            // eslint-disable-next-line no-restricted-globals
            const ok = confirm(`Remove ${duplicateIdCount} duplicate object${duplicateIdCount === 1 ? '' : 's'} (keeps first occurrence of each ID)?`);
            if (!ok) return;
        } catch (e) {
            // ignore confirm failure
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { removeDuplicateObjects } = require('@/features/model-universe/modelSlice');
            dispatch(removeDuplicateObjects({ modelId: modelId ?? undefined }));
        } catch (e) {
            console.warn('Failed to dispatch removeDuplicateObjects action', e);
        }
    };

    // Debug: log data lengths and modelId to help troubleshoot why deleted rows still show
    React.useEffect(() => {
        try {
            // keep logs lightweight
            const incomingLen = Array.isArray(effectiveData) ? effectiveData.length : effectiveData;
            const markedCount = Array.isArray(effectiveData) ? effectiveData.filter((d: any) => !!d.markedAsDeleted).length : 0;
            console.debug('[ObjectTable] modelId=', modelId, 'incoming=', incomingLen, 'displayed=', displayedData.length, 'markedDeleted=', markedCount, 'showDeleted=', showDeleted);
        } catch (e) {
            // ignore
        }
    }, [modelId, data, displayedData, showDeleted]);

    const finalColumns = React.useMemo(() => {
        // Build a selection column that binds to component selection state
        const selectionCol: ColumnDef<Object, any> = {
            id: 'select',
            header: () => (
                // smaller checkbox using Tailwind classes
                <Checkbox
                    className="h-4 w-4"
                    checked={allSelected}
                    onCheckedChange={(v) => selectAll(!!v)}
                />
            ),
            cell: ({ row }) => {
                const id = (row.original as any)?.id;
                return (
                    <Checkbox
                        className="h-4 w-4"
                        checked={!!selectedIds[id]}
                        onCheckedChange={(v) => toggleSelection(id, !!v)}
                    />
                );
            },
        };

        // Build base columns: selection + existing base
        const baseCols = [selectionCol, ...columnsWithRowNumberBase.filter(c => c.id !== 'select') as ColumnDef<Object, any>[]];
        return baseCols;
    }, [allSelected, selectedIds, columnsWithRowNumberBase]);

    const table = useReactTable<Object>({
        data: displayedData,
        columns: finalColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            pagination: { pageIndex, pageSize },
        },
        initialState: {
            columnVisibility: {
                // hide by default
                id: false,
                rowNumber: false,
                typeName: typeColumnVisibleInitially, // set based on data
            },
        },
        meta: {
            onEdit,
            onDelete,
            onRestore,
        } as ObjectTableMeta,
        onSortingChange: setSorting,
        onPaginationChange: useCallback((updater) => {
            setPageIndex((prevPageIndex) => {
                const currentState = { pageIndex: prevPageIndex, pageSize };
                const nextState = typeof updater === 'function' ? updater(currentState) : updater;
                setPageSize(nextState.pageSize);
                return nextState.pageIndex;
            });
        }, [pageSize]),
    });

    return (
        <div className="m-1 w-full min-w-0">
            <div className="flex items-center text-xs p-2 gap-2">
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
                                    className="capitalize"
                                    size="xs"
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
                        {duplicateIdCount > 0 && (
                            <Button
                                onClick={removeDuplicateEntries}
                                size="xs"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-700 hover:bg-yellow-600 text-white"
                            >
                                Remove duplicates ({duplicateIdCount})
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
                                    className={`text-[10px] px-1.5 py-0.5 rounded ${selectedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''} bg-red-800 text-white dark:bg-red-700 dark:text-white hover:bg-red-700`}
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
                                        const ok = confirm(`Purge ${deletedCount} deleted object(s) and corresponding deleted relationships for this model? This is permanent.`);
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
                                className={`text-[10px] px-1.5 py-0.5 rounded ${deletedCount === 0 ? 'opacity-50 cursor-not-allowed bg-red-400' : 'bg-red-700 hover:bg-red-600'} text-white`}
                            >
                                Purge{deletedCount > 0 ? ` (${deletedCount})` : ''}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            {/* Render the table */}
            <div className="max-h-[calc(100vh-22rem)] text-sm overflow-y-auto w-full min-w-0">
                <table className="w-full table-fixed min-w-0 divide-y bg-background divide-gray-500">
                    <thead className="sticky top-0 bg-background">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className={
                                            `${(['rowActions', 'actions', 'select'].includes(header.column.id)
                                                ? 'w-9 min-w-[36px] max-w-[46px] px-1 py-2 text-center'
                                                : header.column.id === 'name' || header.column.id === 'typeName'
                                                    ? 'w-56 max-w-[12rem] px-2 py-2 text-left truncate overflow-hidden'
                                                    : 'px-3 py-2 text-left')} text-xs font-medium text-gray-500 uppercase tracking-wider`
                                        }
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
                    <tbody className="bg-background divide-y divide-gray-500">
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className={`${(['rowActions', 'actions', 'select'].includes(cell.column.id) ? 'w-9 min-w-[36px] max-w-[66px] px-1 py-1 text-center' : 'px-3 py-1')} break-words`}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
        </div >
    );
};