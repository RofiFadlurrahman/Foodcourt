"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Cloud, LayoutDashboard, Store, UtensilsCrossed, ReceiptText, LineChart, FileText, Users, Settings, LogOut, Search, Bell, Sun, Moon, ChevronDown, Menu as MenuIcon, X, User as UserIcon, ShoppingCart } from "lucide-react";
import { initDB, User as DBUser, Tenant as DBTenant } from "@/services/dbSimulator";

interface DashboardLayoutProps {
  children: React.ReactNode;
  roleRequired: "admin" | "tenant";
}

export default function DashboardLayout({ children, roleRequired }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DBUser | null>(() => {
    if (typeof window === "undefined") return null;
    const sessionUserStr = localStorage.getItem("session_user");
    return sessionUserStr ? (JSON.parse(sessionUserStr) as DBUser) : null;
  });
  const [tenant, setTenant] = useState<DBTenant | null>(() => {
    if (typeof window === "undefined") return null;
    const sessionTenantStr = localStorage.getItem("session_tenant");
    return sessionTenantStr ? (JSON.parse(sessionTenantStr) as DBTenant) : null;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    return (localStorage.getItem("foodcourt_theme") || "dark") === "dark";
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Default notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Stok Bakso Urat Spesial menipis (sisa 5)", type: "warning", time: "5 mnt lalu" },
    { id: 2, text: "Transaksi baru dari Kopi Kenangan Rp 36.000", type: "success", time: "12 mnt lalu" },
    { id: 3, text: "Cloud Backup otomatis berhasil dicadangkan", type: "info", time: "1 jam lalu" },
  ]);

  useEffect(() => {
    initDB();

    const sessionUserStr = localStorage.getItem("session_user");

    if (!sessionUserStr) {
      if (roleRequired === "admin") {
        router.push("/admin/login");
      } else {
        router.push("/tenant/login");
      }
      return;
    }

    const sessionUser = JSON.parse(sessionUserStr) as DBUser;

    if (sessionUser.role !== roleRequired) {
      if (sessionUser.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/tenant");
      }
    }
  }, [router, roleRequired]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem("session_user");
    localStorage.removeItem("session_tenant");
    if (roleRequired === "admin") {
      router.push("/admin/login");
    } else {
      router.push("/tenant/login");
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? "dark" : "light";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("foodcourt_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Menghubungkan ke Cloud...</span>
      </div>
    );
  }

  // Sidebar Links Configuration based on Role
  const adminLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Tenant Foodcourt", href: "/admin/tenants", icon: Store },
    { name: "Daftar Menu", href: "/admin/menus", icon: UtensilsCrossed },
    { name: "Transaksi Penjualan", href: "/admin/transactions", icon: ReceiptText },
    { name: "Dashboard Analitik", href: "/admin/analytics", icon: LineChart },
    { name: "Laporan Penjualan", href: "/admin/reports", icon: FileText },
    { name: "Kelola Pengguna", href: "/admin/users", icon: Users },
    { name: "Pengaturan Sistem", href: "/admin/settings", icon: Settings },
  ];

  const tenantLinks = [
    { name: "Dashboard Outlet", href: "/tenant", icon: LayoutDashboard },
    { name: "Kasir (POS)", href: "/tenant/cashier", icon: ShoppingCart },
    { name: "Kelola Menu", href: "/tenant/menus", icon: UtensilsCrossed },
    { name: "Riwayat Transaksi", href: "/tenant/transactions", icon: ReceiptText },
    { name: "Profil Outlet", href: "/tenant/profile", icon: UserIcon },
  ];

  const sidebarLinks = roleRequired === "admin" ? adminLinks : tenantLinks;

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300 font-sans">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#090d16] border-r border-slate-200 dark:border-slate-800/40 shrink-0 sticky top-0 h-screen z-20">
        {/* Brand */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <Cloud className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-cyan-400">CloudFood</span>
            <span className="text-[9px] block font-semibold text-slate-400 tracking-widest uppercase">{roleRequired === "admin" ? "Admin Panel" : "Tenant Panel"}</span>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/40 space-y-2">
          {/* Active Tenant / User name display */}
          <div className="flex items-center gap-3 p-2">
            <img src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} alt={user?.fullName} className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/10" />
            <div className="overflow-hidden">
              <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">{roleRequired === "tenant" && tenant ? tenant.nama_tenant : user?.fullName}</span>
              <span className="block text-[10px] text-slate-400 truncate">{user?.email}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE SIDEBAR DRAWER */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />

          {/* Drawer Body */}
          <div className="relative flex flex-col w-64 max-w-xs bg-white dark:bg-[#090d16] h-full p-4 shadow-2xl border-r border-slate-200 dark:border-slate-800 animate-slide-right">
            <div className="flex items-center justify-between pb-6 mb-4 border-b border-slate-200 dark:border-slate-800/40">
              <div className="flex items-center gap-2">
                <Cloud className="w-6 h-6 text-indigo-500" />
                <span className="font-extrabold text-base text-white">CloudFood</span>
              </div>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/40">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors">
                <LogOut className="w-4.5 h-4.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* NAVBAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200/50 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800/30 dark:bg-[#060913]/70 shrink-0">
          {/* Mobile Sidebar Trigger & Search Bar */}
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/50">
              <MenuIcon className="w-4 h-4 text-slate-500" />
            </button>

            {/* Search Bar Simulator */}
            <div className="relative max-w-md hidden sm:block w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari transaksi, menu, tenant..."
                className="w-full bg-slate-100 border border-transparent rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors" aria-label="Toggle Theme">
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsProfileOpen(false);
                }}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors relative"
              >
                <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
              </button>

              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-80 rounded-2xl glass-premium border border-slate-200 dark:border-slate-800/60 shadow-xl p-4 z-50 animate-fade-in text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/40 pb-2 mb-3">
                      <span className="font-bold text-slate-900 dark:text-white">Pemberitahuan Cloud</span>
                      <button onClick={() => setNotifications([])} className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300">
                        Bersihkan
                      </button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-4 text-slate-500">Tidak ada notifikasi baru</div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className="flex gap-2.5 border-b border-slate-100 dark:border-slate-800/20 pb-2.5 last:border-b-0 last:pb-0">
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.type === "warning" ? "bg-amber-500" : notif.type === "success" ? "bg-emerald-500" : "bg-indigo-500"}`} />
                            <div className="flex-1">
                              <p className="text-slate-800 dark:text-slate-300 leading-relaxed font-medium">{notif.text}</p>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">{notif.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationOpen(false);
                }}
                className="flex items-center gap-2.5 p-1 px-2 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <img src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} alt={user?.fullName} className="w-7 h-7 rounded-lg object-cover" />
                <span className="hidden sm:inline text-xs font-bold text-slate-900 dark:text-white">{roleRequired === "tenant" && tenant ? tenant.nama_tenant : user?.fullName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl glass-premium border border-slate-200 dark:border-slate-800/60 shadow-xl p-2.5 z-50 animate-fade-in text-xs">
                    <div className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-800/40 mb-1.5">
                      <span className="block font-bold text-slate-900 dark:text-white">{user?.fullName}</span>
                      <span className="block text-[10px] text-slate-500">Role: {user?.role === "admin" ? "Super Admin" : "Tenant Outlet"}</span>
                    </div>

                    <Link
                      href={roleRequired === "admin" ? "/admin/settings" : "/tenant/profile"}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/45 font-semibold transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Ubah Profil</span>
                    </Link>

                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 font-semibold transition-colors mt-1.5">
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto relative z-10">{children}</main>
      </div>
    </div>
  );
}
