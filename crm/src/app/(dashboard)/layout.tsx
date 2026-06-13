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
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/segments", label: "Segments", icon: Layers },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/campaigns/new", label: "AI Campaign", icon: Sparkles },
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
      <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight gradient-text">
                Xeno CRM
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                AI Marketing
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }
                  ${item.label === "AI Campaign" ? "mt-4 border border-primary/20 hover:border-primary/40" : ""}
                `}
              >
                <Icon
                  className={`w-4.5 h-4.5 transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  } ${item.label === "AI Campaign" ? "text-primary" : ""}`}
                />
                <span>{item.label}</span>
                {item.label === "AI Campaign" && (
                  <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-[11px] text-muted-foreground">
              AI-Native Marketing CRM
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              v1.0.0 — Demo Environment
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
