"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChefHat, LayoutDashboard, Store, UtensilsCrossed, ReceiptText,
  LineChart, FileText, Users, Settings, LogOut, Search, Bell,
  Sun, Moon, ChevronDown, Menu as MenuIcon, X, User as UserIcon,
  ShoppingCart, Soup, Wallet,
} from "lucide-react";
import { initDB, dbSimulator, User as DBUser, Tenant as DBTenant } from "@/services/dbSimulator";
import {
  getSessionUser, getSessionTenant, setStoredTheme,
  clearAllSession,
} from "@/lib/session";

interface DashboardLayoutProps {
  children: React.ReactNode;
  roleRequired: "admin" | "tenant";
}

export default function DashboardLayout({ children, roleRequired }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DBUser | null>(() => getSessionUser<DBUser>());
  const [tenant, setTenant] = useState<DBTenant | null>(() => getSessionTenant<DBTenant>());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = (typeof window !== "undefined" && window.localStorage.getItem("foodcourt_theme")) || "light";
    return stored === "dark";
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Stok Bakso Urat tinggal 5 porsi (Stan A-01)", type: "warning", time: "5 mnt lalu" },
    { id: 2, text: "Order baru masuk di Kopi Senja — Rp 36.000", type: "success", time: "12 mnt lalu" },
    { id: 3, text: "Laporan harian Plaza Oleos Lt. 2 sudah tersedia", type: "info", time: "1 jam lalu" },
  ]);

  useEffect(() => {
    initDB();

    const sessionUser = getSessionUser<DBUser>();
    if (!sessionUser) {
      if (roleRequired === "admin") router.push("/admin/login");
      else router.push("/tenant/login");
      return;
    }

    if (sessionUser.role !== roleRequired) {
      if (sessionUser.role === "admin") router.push("/admin");
      else router.push("/tenant");
    }
  }, [router, roleRequired]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
      if (typeof dbSimulator.logout === "function") {
        await dbSimulator.logout();
      }
    } catch (err) {
      console.warn("Failed to logout from server:", err);
    }
    clearAllSession();
    if (roleRequired === "admin") router.push("/admin/login");
    else router.push("/tenant/login");
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? "dark" : "light";
    setIsDarkMode(!isDarkMode);
    setStoredTheme(newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Buka dapur...</span>
      </div>
    );
  }

  const adminLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Daftar Stan", href: "/admin/tenants", icon: Store },
    { name: "Daftar Menu", href: "/admin/menus", icon: UtensilsCrossed },
    { name: "Transaksi", href: "/admin/transactions", icon: ReceiptText },
    { name: "Analitik", href: "/admin/analytics", icon: LineChart },
    { name: "Laporan", href: "/admin/reports", icon: FileText },
    { name: "Pengguna", href: "/admin/users", icon: Users },
    { name: "Pengaturan", href: "/admin/settings", icon: Settings },
  ];

  const tenantLinks = [
    { name: "Dashboard Stan", href: "/tenant", icon: LayoutDashboard },
    { name: "Mesin Kasir (POS)", href: "/tenant/cashier", icon: ShoppingCart },
    { name: "Kelola Menu", href: "/tenant/menus", icon: UtensilsCrossed },
    { name: "Riwayat Transaksi", href: "/tenant/transactions", icon: ReceiptText },
    { name: "Profil Stan", href: "/tenant/profile", icon: UserIcon },
  ];

  const sidebarLinks = roleRequired === "admin" ? adminLinks : tenantLinks;
  const sidebarIcon = roleRequired === "admin" ? Wallet : Soup;
  const SidebarIcon = sidebarIcon;

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans">

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border shrink-0 sticky top-0 h-screen z-20">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
            <ChefHat className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div>
            <span className="font-display font-extrabold text-base block leading-none text-foreground">Plaza Oleos</span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
              {roleRequired === "admin" ? "Food Court" : "Stan Outlet"}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[9px] font-extrabold tracking-[0.2em] uppercase text-muted-foreground px-3 mb-1.5 mt-1 flex items-center gap-1.5">
            <SidebarIcon className="w-3 h-3" />
            {roleRequired === "admin" ? "Pengelola" : "Stan Kamu"}
          </div>
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/75 hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1.5">
          <div className="flex items-center gap-2.5 p-2">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt={user?.fullName}
              className="w-8 h-8 rounded-md object-cover"
            />
            <div className="overflow-hidden flex-1">
              <span className="block text-xs font-extrabold text-foreground truncate">
                {roleRequired === "tenant" && tenant ? tenant.nama_tenant : user?.fullName}
              </span>
              <span className="block text-[10px] text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-foreground/40" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 max-w-xs bg-card h-full p-4 border-r border-border">
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="font-display font-extrabold text-sm text-foreground">Plaza Oleos</span>
              </div>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1.5 rounded-md border border-border text-foreground/70">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-bold transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground/75 hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-3 border-t border-border">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/90 backdrop-blur-sm px-5 sm:px-7 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-md border border-border hover:bg-muted transition-colors">
              <MenuIcon className="w-4 h-4 text-foreground/70" />
            </button>
            <div className="relative max-w-md hidden sm:block w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder={roleRequired === "admin" ? "Cari stan, menu, transaksi..." : "Cari menu, transaksi..."}
                className="w-full bg-muted border border-transparent rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-secondary" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            <div className="relative">
              <button
                onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsProfileOpen(false); }}
                className="p-2 rounded-md border border-border hover:bg-muted transition-colors relative"
              >
                <Bell className="w-4 h-4 text-foreground/70" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
              </button>
              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 rounded-md border border-border bg-card shadow-lg p-3 z-50">
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                      <span className="font-display font-extrabold text-sm text-foreground">Papan Pengumuman</span>
                      <button onClick={() => setNotifications([])} className="text-[10px] font-bold text-primary hover:underline">
                        Bersihkan
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-4 text-xs text-muted-foreground">Belum ada info terbaru</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="flex gap-2.5 border-b border-border pb-2.5 last:border-b-0 last:pb-0">
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              n.type === "warning" ? "bg-warning" : n.type === "success" ? "bg-success" : "bg-primary"
                            }`} />
                            <div className="flex-1">
                              <p className="text-xs text-foreground/90 leading-relaxed font-semibold">{n.text}</p>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">{n.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationOpen(false); }}
                className="flex items-center gap-2 p-1 pr-2 rounded-md border border-border hover:bg-muted transition-colors text-left"
              >
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                  alt={user?.fullName}
                  className="w-7 h-7 rounded object-cover"
                />
                <span className="hidden sm:inline text-xs font-extrabold text-foreground">
                  {roleRequired === "tenant" && tenant ? tenant.nama_tenant : user?.fullName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card shadow-lg p-2 z-50">
                    <div className="px-3 py-2 border-b border-border mb-1.5">
                      <span className="block font-extrabold text-sm text-foreground">{user?.fullName}</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {user?.role === "admin" ? "Pengelola Foodcourt" : "Pemilik Stan"}
                      </span>
                    </div>
                    <Link
                      href={roleRequired === "admin" ? "/admin/settings" : "/tenant/profile"}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded text-xs font-bold text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Ubah Profil</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
