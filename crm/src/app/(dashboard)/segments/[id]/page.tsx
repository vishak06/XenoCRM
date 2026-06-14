"use client";

import { useEffect, useState, use } from "react";
import { ChevronLeft, Layers, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string;
  city: string;
  totalSpend: string;
  lastOrderDate: string | null;
  tags: string[];
  orderCount: number;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  englishDescription: string;
}

const tagColors: Record<string, string> = {
  vip: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
  "high-value": "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  new: "bg-blue-500/10 text-blue-700 border-blue-500/25 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
  "churn-risk": "bg-red-500/10 text-red-700 border-red-500/25 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
  dormant: "bg-gray-500/10 text-gray-600 border-gray-500/25 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/30",
  returning: "bg-teal-500/10 text-teal-700 border-teal-500/25 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30",
  "loyalty-member": "bg-purple-500/10 text-purple-700 border-purple-500/25 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
  "sale-shopper": "bg-pink-500/10 text-pink-700 border-pink-500/25 dark:bg-pink-500/15 dark:text-pink-400 dark:border-pink-500/30",
  referral: "bg-indigo-500/10 text-indigo-700 border-indigo-500/25 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30",
  premium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/25 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/30",
};

export default function SegmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [segment, setSegment] = useState<Segment | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = use(params);

  useEffect(() => {
    const fetchSegmentCustomers = async () => {
      try {
        const res = await fetch(`/api/segments/${id}/customers`);
        const data = await res.json();
        if (res.ok) {
          setSegment(data.segment);
          setCustomers(data.customers);
        } else {
          toast.error(data.error || "Failed to fetch segment details");
        }
      } catch (error) {
        toast.error("Failed to fetch segment details");
      } finally {
        setLoading(false);
      }
    };
    fetchSegmentCustomers();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link href="/segments" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Total Spend</TableHead>
                <TableHead>Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Layers className="w-12 h-12 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold">Segment not found</h2>
        <Link href="/segments" className={buttonVariants({ variant: "outline" })}>
          Back to Segments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/segments" className={buttonVariants({ variant: "outline", size: "icon", className: "shrink-0" })}>
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{segment.name}</h1>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30 mt-1">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              {customers.length} Customers
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {segment.englishDescription || segment.description}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Total Spend</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No customers match this segment.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
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
                  <TableCell className="text-center">{customer.orderCount}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
