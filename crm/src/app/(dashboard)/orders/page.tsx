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
import { ChevronLeft, ChevronRight, ArrowUpDown, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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

const AVAILABLE_PRODUCTS = [
  { id: "p1", name: "Premium T-Shirt", category: "Apparel", price: 1500 },
  { id: "p2", name: "Denim Jeans", category: "Apparel", price: 3000 },
  { id: "p3", name: "Running Sneakers", category: "Footwear", price: 5000 },
  { id: "p4", name: "Wireless Earbuds", category: "Electronics", price: 4500 },
  { id: "p5", name: "Coffee Mug", category: "Accessories", price: 500 },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerId: "",
    orderDate: "",
  });
  const [selectedItems, setSelectedItems] = useState<{productId: string, qty: number}[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<{id: string, name: string, email: string}[]>([]);

  useEffect(() => {
    if (isAddOpen && availableCustomers.length === 0) {
      fetch("/api/customers?limit=100")
        .then(res => res.json())
        .then(data => setAvailableCustomers(data.customers || []));
    }
  }, [isAddOpen, availableCustomers.length]);

  const computedAmount = selectedItems.reduce((acc, item) => {
    const product = AVAILABLE_PRODUCTS.find(p => p.id === item.productId);
    return acc + (product ? product.price * item.qty : 0);
  }, 0);

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerId) return toast.error("Please select a customer");
    if (selectedItems.length === 0) return toast.error("Please add at least one product");

    setIsAdding(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newOrder.customerId,
          amount: computedAmount,
          orderDate: new Date(newOrder.orderDate).toISOString(),
          items: selectedItems.map(item => {
            const product = AVAILABLE_PRODUCTS.find(p => p.id === item.productId)!;
            return { name: product.name, category: product.category, qty: item.qty, price: product.price };
          }),
        }),
      });
      if (!res.ok) throw new Error("Failed to add order");
      toast.success("Order added successfully");
      setIsAddOpen(false);
      setNewOrder({ customerId: "", orderDate: "" });
      setSelectedItems([]);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to add order. Ensure Customer ID is valid.");
    } finally {
      setIsAdding(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">
            {pagination ? `${pagination.total.toLocaleString("en-IN")} total orders` : "Loading..."}
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="gap-2"><Plus className="w-4 h-4" /> Add Order</Button>} />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddOrder} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <select
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newOrder.customerId}
                  onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })}
                >
                  <option value="" disabled>Select a customer...</option>
                  {availableCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Products</label>
                <div className="space-y-2 mb-2">
                  {selectedItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select 
                        className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={item.productId}
                        onChange={(e) => {
                          const newItems = [...selectedItems];
                          newItems[i].productId = e.target.value;
                          setSelectedItems(newItems);
                        }}
                      >
                        {AVAILABLE_PRODUCTS.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                        ))}
                      </select>
                      <Input 
                        type="number" 
                        min="1" 
                        className="w-20 h-9" 
                        value={item.qty} 
                        onChange={(e) => {
                          const newItems = [...selectedItems];
                          newItems[i].qty = parseInt(e.target.value) || 1;
                          setSelectedItems(newItems);
                        }}
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedItems(selectedItems.filter((_, idx) => idx !== i))}>
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedItems([...selectedItems, { productId: AVAILABLE_PRODUCTS[0].id, qty: 1 }])}>
                    <Plus className="w-4 h-4 mr-1" /> Add Product
                  </Button>
                </div>
                <div className="text-sm font-medium">Total Amount: ₹{computedAmount.toLocaleString("en-IN")}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Date</label>
                <Input
                  required
                  type="datetime-local"
                  value={newOrder.orderDate}
                  onChange={(e) => setNewOrder({ ...newOrder, orderDate: e.target.value })}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isAdding} className="w-full">
                  {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Order
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
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
                  <TableRow key={i} className="border-border/50">
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
                    <TableRow key={order.id} className="border-border/50 hover:bg-muted/40 transition-colors">
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
