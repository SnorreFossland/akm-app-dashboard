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
    const maxLen = 35;
    const needsTruncate = description && description.length > maxLen;
    const previewText = needsTruncate ? description.slice(0, maxLen) : (description || '');

    return (
        <div className="flex  items-center">
            <span
                className={`${row.original.color ? `text-${row.original.color}-500` : 'text-gray-200'} text-sm font-medium cursor-pointer`}
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
                    className="ml-2 text-xs text-blue-400 hover:underline"
                    aria-label="Show less"
                >
                    show less
                </button>
            )}
        </div>
    );
};

const ActionsCell: React.FC<{ row: any }> = ({ row }) => {
    const dispatch = useDispatch();

    function deleteConcept(id: string) {
        return {
            type: 'ontology/deleteConcept',
            payload: id,
        };
    }

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
                {/* <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
                        Copy ID
                    </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                    // Optionally handle edit via actions menu
                    console.log('Edit action clicked for:', row.original.id);
                    // Trigger editing by setting a global editing state if needed
                    // For inline editing, double-click is used
                }}>
                    Double-Click on text to Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                    console.log('Delete action clicked for:', row.original.id);
                    // Trigger delete action
                    dispatch(deleteConcept(row.original.id))
                }}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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