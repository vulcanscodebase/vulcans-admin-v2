"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Building2, Users, BarChart3, UserCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/components/context/AdminAuthContext";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

interface AdminSidebarProps {
  onLinkClick?: () => void;
}

const sidebarItems: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pods", label: "Pods", icon: Building2 },
  { href: "/dashboard/admins", label: "Admins", icon: Users, superAdminOnly: true },
  { href: "/dashboard/users", label: "All Users", icon: UserCircle, superAdminOnly: true },
  { href: "/dashboard/reports", label: "Interview Reports", icon: FileText },
];

export default function AdminSidebar({ onLinkClick }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin } = useAdminAuth();

  // Filter items based on super admin status
  const visibleItems = sidebarItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  return (
    <nav className="p-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-vulcan-accent-blue text-white"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}

