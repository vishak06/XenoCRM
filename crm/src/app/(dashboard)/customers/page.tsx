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
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpend: string;
  lastOrderDate: string | null;
  tags: string[];
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

  const tagColors: Record<string, string> = {
    vip: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "high-value": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "churn-risk": "bg-red-500/15 text-red-400 border-red-500/30",
    dormant: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    returning: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    "loyalty-member": "bg-purple-500/15 text-purple-400 border-purple-500/30",
    "sale-shopper": "bg-pink-500/15 text-pink-400 border-pink-500/30",
    referral: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    premium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">
          {pagination ? `${pagination.total} total customers` : "Loading..."}
        </p>
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
          className="pl-9 bg-card border-border/50"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
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
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-border/30">
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
                  <TableRow key={customer.id} className="border-border/30 hover:bg-muted/30 transition-colors">
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
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">{customer._count.orders}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${tagColors[tag] || "bg-muted text-muted-foreground"}`}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {customer.tags.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
                            +{customer.tags.length - 3}
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
              className="border-border/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="border-border/50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
