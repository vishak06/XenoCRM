"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  ShoppingBag,
  Layers,
  Megaphone,
  LayoutDashboard,
  Sparkles,
  Zap,
  Package,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/products", label: "Products", icon: Package },
  { href: "/segments", label: "Segments", icon: Layers },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight gradient-text leading-tight">
                Xeno CRM
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase leading-tight">
                AI Marketing
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative
                  ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground nav-active-indicator"
                      : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }
                `}
              >
                <Icon
                  className={`w-[18px] h-[18px] transition-colors flex-shrink-0 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* AI Campaign - special treatment */}
          <div className="pt-3 mt-3 border-t border-sidebar-border">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              AI Tools
            </p>
            <Link
              href="/campaigns/new"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative border
                ${
                  pathname === "/campaigns/new"
                    ? "bg-primary/10 text-primary border-primary/30 nav-active-indicator"
                    : "text-sidebar-foreground/65 hover:text-primary border-primary/15 hover:border-primary/30 hover:bg-primary/5"
                }
              `}
            >
              <Sparkles
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                  pathname === "/campaigns/new"
                    ? "text-primary"
                    : "text-primary/60 group-hover:text-primary"
                }`}
              />
              <span>AI Campaign</span>
              <span className="ml-auto text-[9px] font-bold text-primary-foreground bg-primary px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                New
              </span>
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Xeno CRM
              </p>
              <p className="text-[10px] text-muted-foreground/50">
                v1.0.0 &middot; Demo
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
