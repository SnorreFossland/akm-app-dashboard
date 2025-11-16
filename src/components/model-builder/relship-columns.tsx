import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { editRelationship } from '@/features/model-universe/modelSlice';// Ensure this action exists

// Define interface for relationship data
interface Relationship {
    id: string;
    name: string;
    nameFrom: string;
    nameTo: string;
    color?: string;
    description?: string;
}
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';


// NameCell Component
const NameCell: React.FC<{ row: any }> = ({ row }) => {
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(row.original.name);

    const handleSave = () => {
        if (row.original || name.trim() === "" || name === row.original.name) {
            console.log('Name cannot be empty.');
            return;
        }

        console.log('Saving name for:', row.original.id, name);
        dispatch(editRelationship({ ...row.original, name }));
        setIsEditing(false);
    };

    return isEditing ? (
        <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="border rounded px-2 py-1 bg-background text-white"
        />
    ) : (
        <span
            className={`${row.original.color ? `text-${row.original.color}-500` : 'text-gray-200'} text-sm font-medium cursor-pointer`}
            onDoubleClick={() => {
                console.log('Entering edit mode for name:', row.original.id);
                setIsEditing(true);
            }}
        >
            {row.original.name}
        </span>
    );
};


const DescriptionCell: React.FC<{ row: any }> = ({ row }) => {
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState<string>(row.original.description || '');
    const [expanded, setExpanded] = useState(false);

    const handleSave = () => {
        if (!row.original || description.trim() === '' || description === row.original.description) {
            setIsEditing(false);
            return;
        }
        dispatch(editRelationship({ ...row.original, description }));
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSave();
                    }
                }}
                autoFocus
                className="border rounded px-2 py-1 bg-background w-full"
            />
        );
    }

    const maxLen = 35;
    const needsTruncate = description && description.length > maxLen;
    const previewText = needsTruncate ? description.slice(0, maxLen) : (description || '');

    return (
        <div className="flex items-center">
            <span
                className={`text-sm font-medium cursor-pointer w-full ${expanded ? 'max-w-[22rem] whitespace-normal break-words' : 'whitespace-nowrap truncate'} ${row.original.color ? `text-${row.original.color}-500` : 'text-gray-200'}`}
                onClick={() => setExpanded((prev) => !prev)}
                onDoubleClick={() => setIsEditing(true)}
                title={description}
            >
                {expanded ? (description || '') : previewText}
            </span>
            {needsTruncate && !expanded && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(true);
                    }}
                    className="ml-1 pb-1 text-xl text-blue-400 hover:underline align-middle"
                    aria-label="Show more"
                >
                    ...
                </button>
            )}
            {needsTruncate && expanded && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(false);
                    }}
                    className="ml-auto text-xs text-blue-400 hover:underline"
                    aria-label="Show less"
                >
                    show less
                </button>
            )}
        </div>
    );
};

// ActionsCell Component
const ActionsCell: React.FC<{ row: any }> = ({ row }) => {
    const dispatch = useDispatch();
    const id = row?.original?.id;
    const isDeleted = !!row?.original?.markedAsDeleted;

    // table meta handlers (relship-table sets onDelete/onRestore/onEdit in meta)
    const meta = (row?.table?.options?.meta ?? {}) as any;

    const handleDelete = () => {
        if (!id) return;
        if (meta?.onDelete) return meta.onDelete(id);
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { deleteRelship } = require('@/features/model-universe/modelSlice');
            dispatch(deleteRelship({ id }));
        } catch (e) {
            console.warn('deleteRelship fallback failed', e);
        }
    };

    const handleRestore = () => {
        if (!id) return;
        if (meta?.onRestore) return meta.onRestore(id);
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { restoreRelship } = require('@/features/model-universe/modelSlice');
            dispatch(restoreRelship({ id }));
        } catch (e) {
            console.warn('restoreRelship fallback failed', e);
        }
    };

    const handleEdit = () => {
        if (!id) return;
        if (meta?.onEdit) return meta.onEdit(id);
        dispatch(editRelationship({ ...row.original }));
    };

    return (
        <div className="flex items-center gap-2">
            {!isDeleted ? (
                <button
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-sm bg-red-600/10 hover:bg-red-600/20 text-red-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
            ) : (
                <button
                    title="Restore"
                    onClick={(e) => { e.stopPropagation(); handleRestore(); }}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-sm bg-green-600/10 hover:bg-green-600/20 text-green-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0116.98 0" /></svg>
                </button>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        {/* keep simple vertical dots */}
                        ⋮
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { handleEdit(); }}>
                        Double-Click on Name to Edit
                    </DropdownMenuItem>
                    {!isDeleted ? (
                        <DropdownMenuItem onClick={() => { handleDelete(); }}>
                            Delete
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={() => { handleRestore(); }}>
                            Restore
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export const columns: ColumnDef<Relationship>[] = [
    {
        accessorKey: "id",
        header: () => <span>Id</span>,
        cell: ({ row }) => {
            const relationship = row.original;
            const colorClass = relationship.color ? `text-${relationship.color}-500` : 'text-gray-200';
            return (
                <span className={`${colorClass} text-sm font-medium`}>
                    {relationship.id}
                </span>
            );
        },
    },
    {
        accessorKey: "nameFrom",
        header: () => <span>From</span>,
        cell: ({ row }) => row.original.nameFrom,
    },
    {
        accessorKey: "name",
        header: () => <span>Rel Name</span>,
        cell: ({ row }) => <NameCell row={row} />,
    },
    {
        accessorKey: "description",
        header: () => <span>Description</span>,
        cell: ({ row }) => <DescriptionCell row={row} />,
    },
    {
        accessorKey: "nameTo",
        header: () => <span>To</span>,
        cell: ({ row }) => row.original.nameTo,
    },
    {
        id: "actions",
        cell: ({ row }) => <ActionsCell row={row} />,
    },
];