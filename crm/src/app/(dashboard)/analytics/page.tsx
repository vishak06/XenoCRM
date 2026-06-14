"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, IndianRupee, ShoppingBag, Send, Loader2, UserPlus, ShoppingCart, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AnalyticsData {
  metrics: {
    totalCustomers: number;
    totalRevenue: number;
    totalOrders: number;
    emailsSent: number;
  };
  revenueGraph: { name: string; revenue: number }[];
  emailStats: { name: string; value: number; color: string }[];
  topProducts: { name: string; revenue: number }[];
  segmentsData: { name: string; value: number }[];
  recentActivities: { id: string; type: 'order' | 'customer' | 'campaign'; title: string; description: string; timestamp: string }[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time overview of your CRM metrics.</p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalCustomers.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1">New contacts added</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data.metrics.totalRevenue.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1">Won from {data.metrics.totalOrders} orders</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalOrders.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed orders</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campaign Messages</CardTitle>
            <Send className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.emailsSent.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1">Total messages sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Customers by Segment */}
        <Card className="col-span-1 bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Customers by Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              {data.segmentsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.segmentsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.segmentsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--color-foreground)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No segment data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Open Rates */}
        <Card className="col-span-1 bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Campaign Open Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              {data.emailStats.some(s => s.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.emailStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.emailStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--color-foreground)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No campaign data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Graph */}
        <Card className="col-span-1 lg:col-span-1 bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revenue Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueGraph} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                    tickFormatter={(value) => `₹${value}`}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-foreground)' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {data.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
                    <XAxis 
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: 'var(--color-muted)' }}
                      contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {data.topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No product data</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2">
            <div className="space-y-4">
              {data.recentActivities?.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className={cn(
                    "p-2 rounded-full",
                    activity.type === 'order' ? "bg-blue-500/10 text-blue-500" :
                    activity.type === 'customer' ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-purple-500/10 text-purple-500"
                  )}>
                    {activity.type === 'order' && <ShoppingCart className="h-4 w-4" />}
                    {activity.type === 'customer' && <UserPlus className="h-4 w-4" />}
                    {activity.type === 'campaign' && <Megaphone className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </div>
                </div>
              ))}
              {(!data.recentActivities || data.recentActivities.length === 0) && (
                <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border bg-muted/20 py-8">
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
