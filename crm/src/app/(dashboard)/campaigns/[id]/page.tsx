"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ArrowLeft,
  Loader2,
  Play,
  RefreshCw,
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface CampaignStats {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

interface CommunicationLog {
  id: string;
  status: string;
  renderedMessage: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  failureReason: string | null;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  messageTemplate: string;
  createdAt: string;
  segment?: { name: string } | null;
}

const statusIcons: Record<string, React.ReactNode> = {
  QUEUED: <Loader2 className="w-3 h-3" />,
  SENT: <Send className="w-3 h-3" />,
  DELIVERED: <CheckCircle2 className="w-3 h-3" />,
  OPENED: <Eye className="w-3 h-3" />,
  CLICKED: <MousePointerClick className="w-3 h-3" />,
  FAILED: <XCircle className="w-3 h-3" />,
};

const statusColors: Record<string, string> = {
  QUEUED: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  SENT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DELIVERED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  OPENED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  CLICKED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  FAILED: "bg-red-500/15 text-red-400 border-red-500/30",
};

const FUNNEL_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f87171"];

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}/stats`);
      const data = await res.json();
      setCampaign(data.campaign || null);
      setStats(data.stats || null);
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
      toast.error("Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 seconds if campaign is in progress
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDispatch = async () => {
    setDispatching(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/dispatch`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Dispatched: ${data.sent} sent, ${data.failed} failed`);
        fetchData();
      } else {
        toast.error("Dispatch failed");
      }
    } catch {
      toast.error("Failed to dispatch campaign");
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!campaign || !stats) {
    return <p className="text-muted-foreground">Campaign not found.</p>;
  }

  const funnelData = [
    { name: "Sent", value: stats.sent, pct: stats.total ? Math.round((stats.sent / stats.total) * 100) : 0 },
    { name: "Delivered", value: stats.delivered, pct: stats.sent ? Math.round((stats.delivered / stats.sent) * 100) : 0 },
    { name: "Opened", value: stats.opened, pct: stats.delivered ? Math.round((stats.opened / stats.delivered) * 100) : 0 },
    { name: "Clicked", value: stats.clicked, pct: stats.opened ? Math.round((stats.clicked / stats.opened) * 100) : 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={statusColors[campaign.status]}>
                {campaign.status}
              </Badge>
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                {campaign.channel}
              </Badge>
              {campaign.segment && (
                <span className="text-xs text-muted-foreground">
                  Segment: {campaign.segment.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="border-border/50">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          {campaign.status === "QUEUED" && (
            <Button size="sm" onClick={handleDispatch} disabled={dispatching}>
              {dispatching ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Dispatching...</>
              ) : (
                <><Play className="w-4 h-4 mr-1" /> Launch Campaign</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Delivered", value: stats.delivered, color: "text-emerald-400" },
          { label: "Opened", value: stats.opened, color: "text-amber-400" },
          { label: "Clicked", value: stats.clicked, color: "text-purple-400" },
          { label: "Failed", value: stats.failed, color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Delivery Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 270)" />
                <XAxis type="number" stroke="oklch(0.5 0 270)" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="oklch(0.5 0 270)"
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.17 0.008 270)",
                    border: "1px solid oklch(0.25 0.01 270)",
                    borderRadius: "8px",
                    color: "oklch(0.95 0.005 270)",
                  }}
                  formatter={(value: any, _name: string, entry: any) => [
                    `${value} (${entry.payload.pct}%)`,
                    "",
                  ]}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                  {funnelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Communication Logs */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Delivery Log ({logs.length} recipients)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/30">
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Failure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 50).map((log) => (
                  <TableRow key={log.id} className="border-border/20 hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div>
                        <span className="font-medium text-sm">{log.customer.name}</span>
                        <p className="text-[10px] text-muted-foreground">{log.customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${statusColors[log.status]}`}>
                        {statusIcons[log.status]}
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.sentAt ? new Date(log.sentAt).toLocaleTimeString("en-IN") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.deliveredAt ? new Date(log.deliveredAt).toLocaleTimeString("en-IN") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.openedAt ? new Date(log.openedAt).toLocaleTimeString("en-IN") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-red-400">
                      {log.failureReason || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
