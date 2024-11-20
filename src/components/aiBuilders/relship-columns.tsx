import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { editRelationship } from '@/features/ontology/ontologySlice';// Ensure this action exists
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
        if (name.trim() === "") {
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
            className="border rounded px-2 py-1 bg-gray-600 text-white"
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
                    console.log('Delete action clicked for:', row.original.id);
                    dispatch(deleteRelationship(row.original.id));
                }}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const columns: ColumnDef<string>[] = [
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
        accessorKey: "name",
        header: () => <span>Name</span>,
        cell: ({ row }) => <NameCell row={row} />,
    },
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