import React, { useMemo, useState } from "react";
import { router } from "@inertiajs/react";

import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";

import {
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    Search,
} from "lucide-react";

export default function DataTable({
    columns = [],
    data = [],
    meta = {},
    filters = {},
    routeName = "",
    rowKey = "id",
    selectable = false,
    showExport = false,
    children,
}) {
    const [activeRow, setActiveRow] = useState(null);

    const [searchInput, setSearchInput] = useState(filters.search || "");

    const [perPage, setPerPage] = useState(filters.perPage || 10);

    const [selectedRows, setSelectedRows] = useState({});

    const tableColumns = useMemo(() => {
        const cols = [];

        if (selectable) {
            cols.push({
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                        }
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                    />
                ),
            });
        }

        columns.forEach((col) => {
            cols.push({
                accessorKey: col.key,
                header: () => (
                    <button
                        className="flex items-center gap-1 font-medium"
                        onClick={() => handleSort(col.key)}
                    >
                        {col.label}

                        {filters.sortBy === col.key &&
                            (filters.sortDirection === "asc" ? (
                                <ArrowUp className="w-3 h-3" />
                            ) : (
                                <ArrowDown className="w-3 h-3" />
                            ))}
                    </button>
                ),
                cell: ({ row }) => row.getValue(col.key) ?? "-",
            });
        });

        return cols;
    }, [columns, filters]);

    const handleSort = (key) => {
        const direction =
            filters.sortBy === key && filters.sortDirection === "asc"
                ? "desc"
                : "asc";

        router.get(
            routeName,
            {
                ...filters,
                sortBy: key,
                sortDirection: direction,
            },
            {
                preserveState: true,
            },
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();

        router.get(
            routeName,
            {
                ...filters,
                search: searchInput,
            },
            {
                preserveState: true,
            },
        );
    };

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        state: {
            rowSelection: selectedRows,
        },
        onRowSelectionChange: setSelectedRows,
        enableRowSelection: selectable,
    });

    const currentPage = meta.currentPage || 1;
    const lastPage = meta.lastPage || 1;

    return (
        <div className="space-y-4">
            {/* Toolbar */}

            <form
                onSubmit={handleSearch}
                className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
                <div className="flex gap-2">
                    <Select
                        value={String(perPage)}
                        onValueChange={(value) => {
                            setPerPage(Number(value));

                            router.get(
                                routeName,
                                {
                                    ...filters,
                                    perPage: value,
                                },
                                {
                                    preserveState: true,
                                },
                            );
                        }}
                    >
                        <SelectTrigger className="w-[130px]">
                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent className="w-[130px] overflow-hidden bg-white text-gray-700">
                            <SelectItem value="10">10 rows</SelectItem>
                            <SelectItem value="25">25 rows</SelectItem>
                            <SelectItem value="50">50 rows</SelectItem>
                            <SelectItem value="100">100 rows</SelectItem>
                        </SelectContent>
                    </Select>

                    {showExport && (
                        <Button type="button" variant="outline">
                            Export CSV
                        </Button>
                    )}
                </div>

                <div className="flex gap-2">
                    <Input
                        placeholder="Search..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />

                    <Button type="submit" className="bg-gray-500">
                        <Search className="w-4 h-4 text-white" />
                    </Button>
                </div>
            </form>

            {/* Table */}

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer"
                                    onClick={() => setActiveRow(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}

            <div className="flex items-center justify-between">
                {/* 🎨 FIX: text-gray-400 + text-muted → text-gray-700
                    (dati mapusyaw/halos puti kaya di nakikita sa white bg) */}
                <div className="text-sm text-gray-700">
                    Showing {meta.from} to {meta.to} of {meta.total} results
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage <= 1}
                        onClick={() => {
                            const prev = meta.links?.find(
                                (l) => l.label === "&laquo; Previous",
                            );

                            if (prev?.url) router.visit(prev.url);
                        }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {/* 🎨 FIX: inalis ang 'text-muted' na nag-o-override sa kulay;
                        text-gray-700 na lang + font-medium para klaro */}
                    <span className="flex items-center px-3 text-sm font-medium text-gray-700">
                        {currentPage} / {lastPage}
                    </span>

                    <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage >= lastPage}
                        onClick={() => {
                            const next = meta.links?.find(
                                (l) => l.label === "Next &raquo;",
                            );

                            if (next?.url) router.visit(next.url);
                        }}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Modal Trigger */}

            {typeof children === "function" &&
                activeRow &&
                children(activeRow, () => setActiveRow(null))}
        </div>
    );
}
