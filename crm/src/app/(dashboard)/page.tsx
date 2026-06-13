import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, ShoppingBag, Megaphone, IndianRupee, TrendingUp, Target } from "lucide-react";

async function getStats() {
  const [customerCount, orderCount, campaignCount, totalRevenue, recentCustomers, activeCampaigns] =
    await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.campaign.count(),
      prisma.order.aggregate({ _sum: { amount: true } }),
      prisma.customer.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.campaign.count({
        where: { status: { in: ["QUEUED", "SENDING"] } },
      }),
    ]);

  return {
    customerCount,
    orderCount,
    campaignCount,
    totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
    recentCustomers,
    activeCampaigns,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    {
      title: "Total Customers",
      value: stats.customerCount.toLocaleString("en-IN"),
      icon: Users,
      description: `${stats.recentCustomers} new this month`,
      gradient: "from-blue-500/20 to-indigo-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Total Orders",
      value: stats.orderCount.toLocaleString("en-IN"),
      icon: ShoppingBag,
      description: "All time orders",
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
    },
    {
      title: "Total Revenue",
      value: `₹${Math.round(stats.totalRevenue).toLocaleString("en-IN")}`,
      icon: IndianRupee,
      description: "Lifetime revenue",
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
    },
    {
      title: "Campaigns",
      value: stats.campaignCount.toLocaleString("en-IN"),
      icon: Megaphone,
      description: `${stats.activeCampaigns} active`,
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to <span className="gradient-text">Xeno CRM</span>
        </h1>
        <p className="text-muted-foreground mt-1.5">
          Your AI-powered marketing command center. Build segments and launch campaigns with natural language.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={`relative overflow-hidden border-border/50 bg-gradient-to-br ${stat.gradient} animate-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-background/50 ${stat.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20 hover:border-primary/40 transition-colors group cursor-pointer">
          <a href="/campaigns/new" className="block">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Create AI Campaign</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Describe your campaign in natural language and let AI handle the rest
                  </p>
                </div>
              </div>
            </CardHeader>
          </a>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors group cursor-pointer">
          <a href="/segments" className="block">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base">View Segments</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Browse and manage customer segments with live match counts
                  </p>
                </div>
              </div>
            </CardHeader>
          </a>
        </Card>
      </div>
    </div>
  );
}
