import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { editConcept } from '@/features/model-universe/modelSlice';
import { MoreHorizontal } from 'lucide-react';
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

// Define the Concept type (Should it be type Object?)
type Concept = {
    id: string;
    name: string;
    description: string;
    color?: string; // Optional color property
    typeName: string;
};

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
        dispatch(editConcept({ ...row.original, name }));
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
    const [expanded, setExpanded] = useState<boolean>(false);

    const handleSave = () => {
        // Guard: need a valid row.original and a non-empty changed description
        if (!row.original || description.trim() === "" || description === row.original.description) {
            // No change or invalid input — just close edit mode
            console.log('Description unchanged or empty; abort saving.');
            setIsEditing(false);
            return;
        }
        console.log('Saving description for:', row.original.name, description);
        dispatch(editConcept({ ...row.original, description }));
        setIsEditing(false);
    };

    // Render edit textarea when editing
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

    // Truncate to 25 chars when not expanded
    const maxLen = 75;
    const needsTruncate = description && description.length > maxLen;
    const previewText = needsTruncate ? description.slice(0, maxLen) : (description || '');

    return (
        <div className="flex items-center">
            <span
                className={`${row.original.color ? `text-${row.original.color}-500` : 'text-gray-200'} text-sm font-medium cursor-pointer w-full ${expanded ? 'max-w-[22rem] whitespace-normal break-words' : 'whitespace-nowrap truncate'}`}
                onClick={() => setExpanded(prev => !prev)}
                onDoubleClick={() => {
                    console.log('Entering edit mode for description:', row.original.name);
                    setIsEditing(true);
                }}
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
                    Show less
                </button>
            )}
        </div>
    );
};

const ActionsCell: React.FC<{ row: any }> = ({ row }) => {
    const dispatch = useDispatch();
    const id = row?.original?.id;
    const isDeleted = !!row?.original?.markedAsDeleted;

    // Try to use table meta handlers first (object-table sets these in meta).
    const meta = (row?.table?.options?.meta ?? {}) as any;

    const handleDelete = () => {
        if (!id) return;
        if (meta?.onDelete) return meta.onDelete(id);
        try {
            // fallback to slice action if meta not provided
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { deleteObject } = require('@/features/model-universe/modelSlice');
            dispatch(deleteObject({ id }));
        } catch (e) {
            console.warn('delete fallback failed', e);
        }
    };

    const handleRestore = () => {
        if (!id) return;
        if (meta?.onRestore) return meta.onRestore(id);
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { restoreObject } = require('@/features/model-universe/modelSlice');
            dispatch(restoreObject({ id }));
        } catch (e) {
            console.warn('restore fallback failed', e);
        }
    };

    const handleEdit = () => {
        if (!id) return;
        if (meta?.onEdit) return meta.onEdit(id);
        // fallback: dispatch editConcept already imported
        dispatch(editConcept({ ...row.original }));
    };

    return (
        <div className="flex items-center gap-2">
            {/* Compact quick-action: Delete (X) or Restore */}
            {!isDeleted ? (
                <button
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-sm bg-destructive/10 hover:bg-destructive/20 text-destructive"
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

            {/* Dropdown menu for additional actions */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { handleEdit(); }}>
                        Edit text by double-click on the text
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

export const columns: ColumnDef<Concept>[] = [
    {
        accessorKey: "id",
        header: () => <span>Id</span>,
        enableHiding: true,
        cell: ({ row }) => {
            const concept = row.original;
            const colorClass = concept.color ? `text-${concept.color}-500` : 'text-gray-200'; // Default color
            return (
                <span className={`${colorClass} text-sm font-medium`} >
                    {concept.id}
                </span>
            );
        },
    },
    {
        accessorKey: "name",
        header: () => <span>Name</span>,
        cell: ({ row }) => <NameCell row={row} />,
    },
    {
        accessorKey: "description",
        header: () => <span>Description</span>,
        cell: ({ row }) => <DescriptionCell row={row} />,
    },
    {
        accessorKey: "typeName",
        header: () => <span>Type</span>,
        cell: ({ row }) => {
            // Prefer explicit typeName, otherwise show typeId (typeRef mapped as typeId), or fallback
            const tn = row.original.typeName || (row.original as any).typeId || 'N/A';
            return <span className="text-sm text-gray-300">{tn}</span>;
        },
        // allow hiding if desired:
        enableHiding: true,
    },
    {
        id: "actions",
        cell: ({ row }) => <ActionsCell row={row} />,
    },
];