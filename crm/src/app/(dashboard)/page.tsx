import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, ShoppingBag, Megaphone, IndianRupee, TrendingUp, Target, ArrowUpRight } from "lucide-react";

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
      accentClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-500/8 dark:bg-blue-500/15",
      borderClass: "border-blue-500/15 dark:border-blue-500/20",
    },
    {
      title: "Total Orders",
      value: stats.orderCount.toLocaleString("en-IN"),
      icon: ShoppingBag,
      description: "All time orders",
      accentClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-500/8 dark:bg-emerald-500/15",
      borderClass: "border-emerald-500/15 dark:border-emerald-500/20",
    },
    {
      title: "Total Revenue",
      value: `₹${Math.round(stats.totalRevenue).toLocaleString("en-IN")}`,
      icon: IndianRupee,
      description: "Lifetime revenue",
      accentClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-500/8 dark:bg-amber-500/15",
      borderClass: "border-amber-500/15 dark:border-amber-500/20",
    },
    {
      title: "Campaigns",
      value: stats.campaignCount.toLocaleString("en-IN"),
      icon: Megaphone,
      description: `${stats.activeCampaigns} active`,
      accentClass: "text-purple-600 dark:text-purple-400",
      bgClass: "bg-purple-500/8 dark:bg-purple-500/15",
      borderClass: "border-purple-500/15 dark:border-purple-500/20",
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
              className={`relative overflow-hidden border ${stat.borderClass} hover:shadow-md transition-all duration-300 animate-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgClass}`}>
                  <Icon className={`w-4 h-4 ${stat.accentClass}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/15 hover:border-primary/30 hover:shadow-md transition-all duration-300 group cursor-pointer">
          <a href="/campaigns/new" className="block">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/8 dark:bg-primary/15 group-hover:bg-primary/15 dark:group-hover:bg-primary/25 transition-colors">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-1.5">
                    Create AI Campaign
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Describe your campaign in natural language and let AI handle the rest
                  </p>
                </div>
              </div>
            </CardHeader>
          </a>
        </Card>

        <Card className="hover:border-border hover:shadow-md transition-all duration-300 group cursor-pointer">
          <a href="/segments" className="block">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/8 dark:bg-emerald-500/15 group-hover:bg-emerald-500/15 dark:group-hover:bg-emerald-500/25 transition-colors">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-1.5">
                    View Segments
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
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
