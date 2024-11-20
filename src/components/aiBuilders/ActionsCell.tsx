import React from 'react';
import { useDispatch } from 'react-redux';
import { deleteConcept } from '@/features/ontology/ontologySlice';
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

type ActionsCellProps = {
    row: any;
    onEdit: (id: string) => void;
};

const ActionsCell: React.FC<ActionsCellProps> = ({ row, onEdit }) => {
    const dispatch = useDispatch();

    const handleEdit = () => {
        onEdit(row.original.id);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this concept?')) {
            dispatch(deleteConcept(row.original.id));
        }
    };

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
                <DropdownMenuItem onClick={handleEdit}>
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ActionsCell;