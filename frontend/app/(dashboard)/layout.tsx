"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Box,
  UserPlus,
  UserCog,
  ChevronDown,
  KeyRound,
  LogOut
} from "lucide-react";
import styles from "./dashboard.module.css";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import NotificationBell from "@/components/shared/NotificationBell";
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
  { name: "Users", href: "/users", icon: UserCog },
  { name: "User Registration", href: "/register", icon: UserPlus },
];

const ROLE_ACCESS: Record<string, string[]> = {
  "Procurement Officer": ["Dashboard", "RFQ's", "Quotations", "Purchase orders", "Invoices"],
  "Vendor": ["Dashboard", "Quotations", "RFQ's", "Purchase orders", "Invoices"],
  "Manager/Approver": ["Dashboard", "Approvals"],
  "Admin": ["Dashboard", "Vendors", "Reports", "Activity", "Approvals", "Users", "User Registration"],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const allowedLinks = NAV_LINKS.filter(link => {
    if (!user) return true;
    const allowed = ROLE_ACCESS[user.role] || [];
    return allowed.includes(link.name);
  });

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
            {allowedLinks.map((link) => {
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
              <div className={styles.topBarRight}>
                <NotificationBell />
                <div className={styles.userMenu} ref={menuRef}>
                  <button
                    className={styles.userMenuButton}
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-label="User menu"
                  >
                    <span className={styles.userMenuAvatar}>
                      {user.name?.charAt(0).toUpperCase() ?? "U"}
                    </span>
                    <span className={styles.userMenuInfo}>
                      <span className={styles.userMenuName}>{user.name}</span>
                      <span className={styles.userMenuRole}>{user.role}</span>
                    </span>
                    <ChevronDown size={16} className={styles.userMenuChevron} />
                  </button>

                  {menuOpen && (
                    <div className={styles.userDropdown}>
                      <div className={styles.userDropdownHeader}>
                        <span className={styles.userDropdownName}>{user.name}</span>
                        <span className={styles.userDropdownEmail}>{user.email}</span>
                      </div>
                      <div className={styles.userDropdownDivider} />
                      <button
                        className={styles.userDropdownItem}
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/change-password");
                        }}
                      >
                        <KeyRound size={15} />
                        Change Password
                      </button>
                      <div className={styles.userDropdownDivider} />
                      <button className={styles.userDropdownLogout} onClick={handleLogout}>
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
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
