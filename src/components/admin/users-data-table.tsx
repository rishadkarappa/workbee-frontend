import { useCallback, useEffect, useState } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from "@tanstack/react-table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AuthService } from "@/services/auth-service";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/utils/error-helper";
import { toast } from "sonner";

// Define User type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isBlocked: boolean;
  countofpost?: number;
  phone?: string;
  numberOfComplaints?: string;
}

// Toolbar props
interface UserDataTableToolbarProps {
  table: ReturnType<typeof useReactTable<User>>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  isLoading?: boolean;
}

// Status Badge

function UserStatusBadge({ isBlocked }: { isBlocked: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        isBlocked
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      }
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isBlocked ? "bg-destructive" : "bg-emerald-500"
        }`}
      />
      {isBlocked ? "Blocked" : "Active"}
    </Badge>
  );
}

// Toolbar

function UserDataTableToolbar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLoading = false,
}: UserDataTableToolbarProps) {
  const isFiltered = searchValue !== "" || statusFilter !== "all";

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search users..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />

          {isLoading && searchValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          )}
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={onStatusFilterChange}
        >
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              onSearchChange("");
              onStatusFilterChange("all");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

// Main Component

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFiltersState] =
    useState<ColumnFiltersState>([]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [pageCount, setPageCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearch = useDebounce(searchValue, 500);


  // Fetch users


  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await AuthService.getUsers(
        pagination.pageIndex + 1,
        pagination.pageSize,
        debouncedSearch,
        statusFilter
      );

      setUsers(res.data.data.users);
      setTotalUsers(res.data.data.total);
      setPageCount(res.data.data.totalPages);
    } catch (error) {
      console.log(
        "Error while fetching users:",
        getErrorMessage(error)
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    statusFilter,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, [debouncedSearch, statusFilter]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };


  // Block / Unblock


  const blockUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await AuthService.blockUser(selectedUser.id);

      if (res.data.success) {
        toast.warning(
          selectedUser.isBlocked
            ? "User Unblocked"
            : "User Blocked"
        );

        setIsModalOpen(false);
        fetchUsers();
      }
    } catch (error) {
      toast.error("Error occurred while blocking user");
      console.log(error);
    }
  };


  // Columns


  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original;

        return <UserStatusBadge isBlocked={user.isBlocked} />;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedUser(row.original);
            setIsModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];


  // Table


  const table = useReactTable<User>({
    data: users,
    columns,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFiltersState,
    onPaginationChange: setPagination,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <UserDataTableToolbar
        table={table}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        isLoading={isLoading}
      />

      {/* 
          User Details Dialog
       */}

      <Dialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      >
        <DialogContent className="max-w-md overflow-hidden rounded-xl p-0">
          {/* Header */}
          <div className="border-b bg-muted/30 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                User Details
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="space-y-6 px-6 py-5">
            {selectedUser && (
              <div className="space-y-4 text-sm">
                {/* Basic Details */}
                <div className="space-y-2">
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Name :{" "}
                    </span>
                    <span className="text-foreground">
                      {selectedUser.name}
                    </span>
                  </p>

                  <p>
                    <span className="font-medium text-muted-foreground">
                      Email :{" "}
                    </span>
                    <span className="text-foreground">
                      {selectedUser.email}
                    </span>
                  </p>

                  <p>
                    <span className="font-medium text-muted-foreground">
                      Role :{" "}
                    </span>
                    <span className="text-foreground">
                      {selectedUser.role}
                    </span>
                  </p>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">
                      Status :
                    </span>

                    <UserStatusBadge
                      isBlocked={selectedUser.isBlocked}
                    />
                  </div>

                  <p>
                    <span className="font-medium text-muted-foreground">
                      Phone Number :{" "}
                    </span>

                    <span className="text-foreground">
                      {selectedUser.phone ?? "Not available"}
                    </span>
                  </p>
                </div>

                <Separator />

                {/* Statistics */}
                <div className="space-y-2">
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Number of Post Work :{" "}
                    </span>

                    <span className="text-foreground">
                      {selectedUser.countofpost ?? "Not available"}
                    </span>
                  </p>

                  <p>
                    <span className="font-medium text-muted-foreground">
                      Complaint Against this User :{" "}
                    </span>

                    <span className="text-foreground">
                      {selectedUser.numberOfComplaints ??
                        "Not available"}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t bg-muted/30 px-6 py-4">
            <Button
              variant="outline"
              onClick={blockUser}
              className={
                selectedUser?.isBlocked
                  ? "hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                  : "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              }
            >
              {selectedUser?.isBlocked
                ? "Unblock User"
                : "Block User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 
          Table
       */}

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {/* Loading */}
            {isLoading && users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length ? (
              /* Users */
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              /* Empty */
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 
          Pagination
       */}

      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {totalUsers > 0 && (
            <>
              Showing{" "}
              {pagination.pageIndex * pagination.pageSize + 1}{" "}
              to{" "}
              {Math.min(
                (pagination.pageIndex + 1) *
                  pagination.pageSize,
                totalUsers
              )}{" "}
              of {totalUsers} users
            </>
          )}
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={
                !table.getCanPreviousPage() || isLoading
              }
            >
              Previous
            </Button>

            <div className="flex w-[100px] items-center justify-center text-sm font-medium text-foreground">
              Page {pagination.pageIndex + 1} of{" "}
              {pageCount || 1}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;