// src/components/aiBuilders/concept-columns.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { editConcepzt } from '@/features/model-universe/modelSlice';
import { ColumnDef, Row } from '@tanstack/react-table';
import ActionsCell from './ActionsCell';
import { Input } from '@/components/ui/input';

type Concept = {
    id: string;
    name: string;
    description: string;
    color?: string;
};

// NameCell Component
interface NameCellProps {
    row: Row<Concept>;
    isEditing: boolean;
    setEditing: () => void;
    setEditingRowId: (id: string | null) => void;
}

const NameCell: React.FC<NameCellProps> = ({ row, isEditing, setEditing, setEditingRowId }) => {
    const dispatch = useDispatch();
    const [name, setName] = React.useState(row.original.name);

    const handleSave = () => {
        if (name.trim() === "") {
            alert('Name cannot be empty.');
            return;
        }
        dispatch(editConcept({ ...row.original, name }));
        setEditingRowId(null);
    };

    return isEditing ? (
        <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="border rounded px-2 py-1"
        />
    ) : (
        <span
            className={`${row.original.color ? `text-${row.original.color}-500` : 'text-gray-200'} text-sm font-medium cursor-pointer`}
            onDoubleClick={setEditing}
        >
            {row.original.name}
        </span>
    );
};

// DescriptionCell Component
interface DescriptionCellProps {
    row: Row<Concept>;
    isEditing: boolean;
    setEditing: () => void;
    setEditingRowId: (id: string | null) => void;
}

const DescriptionCell: React.FC<DescriptionCellProps> = ({ row, isEditing, setEditing, setEditingRowId }) => {
    const dispatch = useDispatch();
    const [description, setDescription] = React.useState(row.original.description);

    const handleSaveDescription = () => {
        if (description.trim() === "") {
            alert('Description cannot be empty.');
            return;
        }
        dispatch(editConcept({ ...row.original, description }));
        setEditingRowId(null);
    };

    return isEditing ? (
        <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSaveDescription}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveDescription()}
            autoFocus
            className="border rounded px-2 py-1 w-full"
        />
    ) : (
        <span
            className={`${row.original.color ? `text-${row.original.color}-500` : 'text-gray-200'} text-sm font-medium cursor-pointer`}
            onDoubleClick={setEditing}
        >
            {row.original.description}
        </span>
    );
};

// Columns Definition
export const getColumns = (
    editingRowId: string | null,
    setEditingRowId: (id: string | null) => void,
    handleDelete: (id: string) => void
): ColumnDef<Concept>[] => [
    {
        accessorKey: "id",
        header: () => <span>Id</span>,
        cell: ({ row }) => (
            <ActionsCell
                row={row}
                onEdit={(id: string) => setEditingRowId(id)}
                onDelete={() => handleDelete(row.original.id)}
            />
        ),
    },
    {
        accessorKey: "name",
        header: () => <span>Name</span>,
        cell: ({ row }) => {
            const isEditing = editingRowId === row.original.id;

            return (
                <NameCell
                    row={row}
                    isEditing={isEditing}
                    setEditing={() => setEditingRowId(row.original.id)}
                    setEditingRowId={setEditingRowId}
                />
            );
        },
    },
    {
        accessorKey: "description",
        header: () => <span>Description</span>,
        cell: ({ row }) => {
            const isEditing = editingRowId === row.original.id;

            return (
                <DescriptionCell
                    row={row}
                    isEditing={isEditing}
                    setEditing={() => setEditingRowId(row.original.id)}
                    setEditingRowId={setEditingRowId}
                />
            );
        },
    },
    // Add more columns if necessary
];