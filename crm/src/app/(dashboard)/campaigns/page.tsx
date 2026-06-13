"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Plus, Eye } from "lucide-react";

interface CampaignStats {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  createdAt: string;
  stats: CampaignStats;
  _count: { communicationLogs: number };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  QUEUED: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  SENDING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  FAILED: "bg-red-500/15 text-red-400 border-red-500/30",
};

const channelColors: Record<string, string> = {
  WHATSAPP: "bg-green-500/15 text-green-400 border-green-500/30",
  SMS: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  EMAIL: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  RCS: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            {campaigns.length} total campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New AI Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16 border border-border/50 border-dashed rounded-xl">
          <Megaphone className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            No campaigns yet. Create your first AI-powered campaign.
          </p>
          <Link href="/campaigns/new">
            <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>Campaign</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Recipients</TableHead>
                <TableHead className="text-center">Sent</TableHead>
                <TableHead className="text-center">Delivered</TableHead>
                <TableHead className="text-center">Opened</TableHead>
                <TableHead className="text-center">Clicked</TableHead>
                <TableHead className="text-center">Failed</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-border/30">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : campaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <span className="font-medium">{campaign.name}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(campaign.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={channelColors[campaign.channel] || ""}>
                          {campaign.channel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[campaign.status] || ""}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{campaign.stats.total}</TableCell>
                      <TableCell className="text-center text-blue-400">{campaign.stats.sent}</TableCell>
                      <TableCell className="text-center text-emerald-400">{campaign.stats.delivered}</TableCell>
                      <TableCell className="text-center text-amber-400">{campaign.stats.opened}</TableCell>
                      <TableCell className="text-center text-purple-400">{campaign.stats.clicked}</TableCell>
                      <TableCell className="text-center text-red-400">{campaign.stats.failed}</TableCell>
                      <TableCell>
                        <Link href={`/campaigns/${campaign.id}`}>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
