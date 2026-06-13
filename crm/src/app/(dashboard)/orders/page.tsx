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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

interface Order {
  id: string;
  amount: string;
  orderDate: string;
  items: Array<{ name: string; category: string; qty: number; price: number }>;
  customer: { name: string; email: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: "15",
      });
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">
          {pagination ? `${pagination.total} total orders` : "Loading..."}
        </p>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>
                <button onClick={() => handleSort("amount")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Amount <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Items</TableHead>
              <TableHead>
                <button onClick={() => handleSort("orderDate")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Date <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-border/30">
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              : orders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  return (
                    <TableRow key={order.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {order.id.substring(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{order.customer.name}</span>
                          <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        ₹{parseFloat(order.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {items.length} item{items.length !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.orderDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

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
