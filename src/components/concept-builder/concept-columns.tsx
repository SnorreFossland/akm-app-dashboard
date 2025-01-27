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

// Define the Concept type
type Concept = {
    id: string;
    name: string;
    description: string;
    color?: string; // Optional color property
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
        console.log('Saving name for:', row.original.name, name);
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

const DescriptionCell: React.FC<{ row: any }> = ({ row }) => {
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(row.original.description);

    const handleSave = () => {
        if (row.original || description.trim() === "" || description === row.original.description) {
            console.log('Description cannot be empty.');
            return;
        }
        console.log('Saving description for:', row.original.name, description);
        dispatch(editConcept({ ...row.original, description }));
        setIsEditing(false);
    };

    return isEditing ? (
        <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="border rounded px-2 py-1 bg-gray-800 w-full"
        />
    ) : (
        <span
            className={`${row.original.color ? `text-${row.original.color}-500` : 'text-gray-200'} text-sm font-medium cursor-pointer`}
            onDoubleClick={() => {
                console.log('Entering edit mode for description:', row.original.name);
                setIsEditing(true);
            }}
        >
            {row.original.description}
        </span>
    );
};

const ActionsCell: React.FC<{ row: any }> = ({ row }) => {
    const dispatch = useDispatch();

    function deleteConcept(id: string) {
        return {
            type: 'ontology/deleteConcept',
            payload: name,
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
                {/* <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.name)}>
                        Copy ID
                    </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                    // Optionally handle edit via actions menu
                    console.log('Edit action clicked for:', row.original.name);
                    // Trigger editing by setting a global editing state if needed
                    // For inline editing, double-click is used
                }}>
                    Double-Click on text to Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                    console.log('Delete action clicked for:', row.original.name);
                    // Trigger delete action
                    dispatch(deleteConcept(row.original.name))
                }}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const columns: ColumnDef<Concept>[] = [
    {
        accessorKey: "name",
        header: () => <span>Name</span>,
        cell: ({ row }) => {
            const concept = row.original;
            const colorClass = concept.color ? `text-${concept.color}-500` : 'text-gray-200'; // Default color
            return (
                <span className={`${colorClass} text-sm font-medium`} >
                    {concept.name}
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
        accessorKey: "description",
        header: () => <span>Description</span>,
        cell: ({ row }) => <DescriptionCell row={row} />,   
    },
    {
        id: "actions",
        cell: ({ row }) => <ActionsCell row={row} />,
        },
];