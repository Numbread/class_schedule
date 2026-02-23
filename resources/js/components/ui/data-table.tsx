import { Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { type PaginatedData } from '@/types';

interface DataTableProps<T> {
    data: PaginatedData<T>;
    columns: TableColumn<T>[];
    searchPlaceholder?: string;
    filters?: FilterOption[];
    currentFilters?: Record<string, string>;
    actions?: (item: T) => ReactNode;
    onSearch?: (value: string) => void;
    onFilterChange?: (key: string, value: string) => void;
    createLink?: string;
    createLabel?: string;
}

interface TableColumn<T> {
    key: string;
    label: string;
    render?: (item: T) => ReactNode;
    className?: string;
}

interface FilterOption {
    key: string;
    label: string;
    options: { value: string; label: string }[];
}

export function DataTable<T extends { id: number }>({
    data,
    columns,
    searchPlaceholder = 'Search...',
    filters = [],
    currentFilters = {},
    actions,
    createLink,
    createLabel = 'Create New',
}: DataTableProps<T>) {
    const [searchValue, setSearchValue] = useState(currentFilters.search || '');

    const handleSearch = () => {
        router.get(
            window.location.pathname,
            { ...currentFilters, search: searchValue },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...currentFilters, [key]: value };
        if (value === 'all') {
            delete newFilters[key];
        }
        router.get(window.location.pathname, newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    <div className="relative max-w-sm flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-9"
                        />
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleSearch}>
                        Search
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {filters.map((filter) => (
                        <Select
                            key={filter.key}
                            value={currentFilters[filter.key] || 'all'}
                            onValueChange={(value) => handleFilterChange(filter.key, value)}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder={filter.label} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All {filter.label}</SelectItem>
                                {filter.options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}

                    {createLink && (
                        <Button asChild>
                            <Link href={createLink}>{createLabel}</Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={`text-left font-medium text-foreground ${column.className || ''}`}
                                >
                                    {column.label}
                                </TableHead>
                            ))}
                            {actions && (
                                <TableHead className="text-right font-medium text-foreground">
                                    Actions
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.data.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="hover:bg-muted/30"
                                >
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.key}
                                            className={column.className || ''}
                                        >
                                            {column.render
                                                ? column.render(item)
                                                : (item[column.key as keyof T] as ReactNode)}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell className="text-right">
                                            {actions(item)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                        Showing {data.from} to {data.to} of {data.total} results
                    </p>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={data.current_page === 1}
                            onClick={() =>
                                router.get(data.first_page_url, {}, { preserveScroll: true })
                            }
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={!data.prev_page_url}
                            onClick={() =>
                                data.prev_page_url &&
                                router.get(data.prev_page_url, {}, { preserveScroll: true })
                            }
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <span className="text-muted-foreground px-3 text-sm">
                            Page {data.current_page} of {data.last_page}
                        </span>

                        <Button
                            variant="outline"
                            size="icon"
                            disabled={!data.next_page_url}
                            onClick={() =>
                                data.next_page_url &&
                                router.get(data.next_page_url, {}, { preserveScroll: true })
                            }
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={data.current_page === data.last_page}
                            onClick={() =>
                                router.get(data.last_page_url, {}, { preserveScroll: true })
                            }
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

