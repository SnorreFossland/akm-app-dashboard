import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { editRelationship } from '@/features/model-universe/modelSlice';// Ensure this action exists
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




interface Relationship {
    name: string;
    nameFrom: string;
    nameTo: string;
    color?: string;
}
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
        console.log('Saving name for:', row.original.name, name);
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
            className="border rounded px-2 py-1 bg-gray-800 text-white"
        />
    ) : (
        <span
            className={`${row.original.color ? `text-${row.original.color}-500` : 'text-gray-200'} text-sm font-medium cursor-pointer`}
            onDoubleClick={() => {
                console.log('Entering edit mode for name:', row.original.name);
                setIsEditing(true);
            }}
        >
            {row.original.name}
        </span>
    );
};


// ActionsCell Component
const ActionsCell: React.FC<{ row: any }> = ({ row }) => {
    const dispatch = useDispatch();

    function deleteRelationship(id: string) {
        return {
            type: 'relationships/deleteRelationship',
            payload: id,
        };
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    {/* Replace with an appropriate icon */}
                    ⋮
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                    // Optionally handle edit via actions menu
                    console.log('Edit action clicked for:', row.original.name);
                    // Trigger editing by setting a global editing state if needed
                    // For inline editing, double-click is used
                }}>
                    Double-Click on Name text to Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                    console.log('Delete action clicked for:', row.original.name);
                    dispatch(deleteRelationship(row.original.name));
                }}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


export const columns: ColumnDef<Relationship>[] = [
    {
        accessorKey: "name",
        header: () => <span>Name</span>,
        cell: ({ row }) => {
            const relationship = row.original;
            const colorClass = relationship.color ? `text-${relationship.color}-500` : 'text-gray-200';
            return (
                <span className={`${colorClass} text-sm font-medium`}>
                    {relationship.name}
                </span>
            );
        },
    },
    // {
    //     accessorKey: "name",
    //     header: () => <span>Name</span>,
    //     cell: ({ row }) => <NameCell row={row} />,
    // },
    {
        accessorKey: "nameFrom",
        header: () => <span>Name from</span>,
        cell: ({ row }) => row.original.nameFrom,
    },
    {
        accessorKey: "nameTo",
        header: () => <span>Name to</span>,
        cell: ({ row }) => row.original.nameTo,
    },
    {
        id: "actions",
        cell: ({ row }) => <ActionsCell row={row} />,
    },
];