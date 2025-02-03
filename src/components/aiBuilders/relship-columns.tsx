"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { OntologySchema } from "@/ontologySchema";
import { z } from "zod";

// Define the type based on OntologySchema
type OntologyData = z.infer<typeof OntologySchema>["ontologyData"];

export const columns: ColumnDef<OntologyData>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
            />
        ),
    },
    {
        accessorKey: "nameFrom",
        header: () => <span>From</span>,
        cell: ({ row }) => {
            const relship = row.original;
            const colorClass = relship.color ? `text-${relship.color}-500` : 'text-gray-200'; // Default color
            return (
                <span className={`${colorClass} text-sm font-medium`}>
                    {relship.nameFrom}
                </span>
            );
        }
    },
    {
        accessorKey: "name",
        header: () => <span>Relationship name</span>,
        cell: ({ row }) => {
            const relship = row.original;
        const colorClass = relship.color ? `text-${relship.color}-500` : 'text-gray-200'; // Default color
        return(
                <span className = {`${colorClass} text-sm font-medium`} >
                  { relship.name }
                </span >
            );
        },
    },
    {
        accessorKey: "nameTo",
        header: () => <span>To</span>,
        cell: ({ row }) => {
            const relship = row.original;
            const colorClass = relship.color ? `text-${relship.color}-500` : 'text-gray-200'; // Default color
            return (
                <span className={`${colorClass} text-sm font-medium`}>
                    {relship.nameTo}
                </span>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const ontologyItem = row.original;

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
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(ontologyItem.id)}
                        >
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];