"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpend: string;
  lastOrderDate: string | null;
  segments: string[];
  _count: { orders: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
  });

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) throw new Error("Failed to add customer");
      toast.success("Customer added successfully");
      setIsAddOpen(false);
      setNewCustomer({ name: "", email: "", phone: "", city: "" });
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to add customer");
    } finally {
      setIsAdding(false);
    }
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: "15",
      });
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder, page]);

  useEffect(() => {
    const timeout = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timeout);
  }, [fetchCustomers]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">
            {pagination ? `${pagination.total.toLocaleString("en-IN")} total customers` : "Loading..."}
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="gap-2"><Plus className="w-4 h-4" /> Add Customer</Button>} />
          <DialogContent className="sm:max-w-[425px] p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl">Add Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-6 pt-2">
              <div className="space-y-3">
                <label className="text-sm font-medium block mb-1">Name</label>
                <Input
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium block mb-1">Email</label>
                <Input
                  required
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium block mb-1">Phone</label>
                <Input
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium block mb-1">City</label>
                <Input
                  required
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  placeholder="Mumbai"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isAdding} className="w-full">
                  {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Customer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or city..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>
                <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Name <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>
                <button onClick={() => handleSort("city")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  City <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("totalSpend")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Total Spend <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("lastOrderDate")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Last Order <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Segments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  </TableRow>
                ))
              : customers.map((customer) => (
                  <TableRow key={customer.id} className="border-border/50 hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{customer.email}</TableCell>
                    <TableCell>{customer.city}</TableCell>
                    <TableCell className="font-mono text-sm">
                      ₹{parseFloat(customer.totalSpend).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer.lastOrderDate
                        ? new Date(customer.lastOrderDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="text-center">{customer._count.orders}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.segments.slice(0, 3).map((segment) => (
                          <Badge
                            key={segment}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
                          >
                            {segment}
                          </Badge>
                        ))}
                        {customer.segments.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
                            +{customer.segments.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
