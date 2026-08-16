"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FileEdit, 
  CheckSquare, 
  ShoppingCart, 
  Receipt, 
  BarChart3, 
  Activity,
  Box
} from "lucide-react";
import styles from "./dashboard.module.css";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/lib/AuthContext";
import { Toaster } from "react-hot-toast";

const NAV_LINKS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Vendors", href: "/vendors", icon: Users },
  { name: "RFQ's", href: "/rfqs", icon: FileText },
  { name: "Quotations", href: "/quotations", icon: FileEdit },
  { name: "Approvals", href: "/approvals", icon: CheckSquare },
  { name: "Purchase orders", href: "/purchase-orders", icon: ShoppingCart },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Activity", href: "/activity", icon: Activity },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.logoText + " " + styles.logo}>VendorBridge</span>
            <Box className={styles.logoIcon} style={{ display: 'none' }} size={24} />
          </div>
          <nav className={styles.nav}>
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                >
                  <Icon size={20} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className={styles.main}>
          {/* Top Bar */}
          <header className={styles.topBar}>
            {user && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.username}</span>
                <span className={styles.userRole}>{user.role}</span>
              </div>
            )}
            <div className={styles.windowControls}>
              <div className={styles.controlDot} style={{ backgroundColor: '#ff5f56' }} />
              <div className={styles.controlDot} style={{ backgroundColor: '#ffbd2e' }} />
              <div className={styles.controlDot} style={{ backgroundColor: '#27c93f' }} />
            </div>
          </header>

          {/* Content */}
          <div className={styles.content}>
            {children}
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
