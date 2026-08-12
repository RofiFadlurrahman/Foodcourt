"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Tenant, Transaction } from "@/services/dbSimulator";
import { getSessionTenant } from "@/lib/session";
import {
  UtensilsCrossed, Calendar,
  DollarSign, ShoppingBag, Activity, Soup
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from "recharts";

export default function TenantDashboard() {
  const router = useRouter();
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof dbSimulator.getTenantStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const sessionTenant = getSessionTenant<Tenant>();
      if (!sessionTenant) return;
      setActiveTenant(sessionTenant);

      const tenantStats = await dbSimulator.getTenantStats();
      setStats(tenantStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 0);
    void Promise.resolve().then(fetchData);
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <DashboardLayout roleRequired="tenant">
      <div className="space-y-6">

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
              Halo, {activeTenant?.nama_pemilik} <Soup className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Selamat datang di Panel Stan <b className="text-foreground font-extrabold">{activeTenant?.nama_tenant}</b>. Pantau penjualan stan kamu.</p>
          </div>

          <button
            onClick={fetchData}
            className="self-start sm:self-auto bg-card hover:bg-muted text-foreground border border-border text-xs font-extrabold py-2.5 px-4 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: "3s" }} /> Segarkan
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-card border border-border rounded-md" />
              ))}
            </div>
            <div className="h-72 bg-card border border-border rounded-md animate-pulse" />
          </div>
        ) : (
          <>
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <div className="bg-card border border-border rounded-md p-5 hover:border-primary transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Pendapatan Hari Ini</span>
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                    {formatRupiah(stats?.revenueToday || 0)}
                  </h3>
                  <span className="text-[10px] text-muted-foreground block mt-1">Update tiap beberapa detik</span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-5 hover:border-secondary transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Pendapatan Bulan Ini</span>
                  <div className="p-2 rounded-md bg-secondary/15 text-secondary">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                    {formatRupiah(stats?.revenueThisMonth || 0)}
                  </h3>
                  <span className="text-[10px] text-success font-extrabold block mt-1">▲ vs bulan lalu</span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-5 hover:border-accent transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Penjualan</span>
                  <div className="p-2 rounded-md bg-accent/15 text-accent">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                    {stats?.totalSalesCount || 0} Transaksi
                  </h3>
                  <span className="text-[10px] text-muted-foreground block mt-1">Total pesanan terproses</span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-5 hover:border-warning transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Menu Terlaris</span>
                  <div className="p-2 rounded-md bg-warning/15 text-warning">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground truncate">
                    {stats?.bestSellerMenu || "Belum ada"}
                  </h3>
                  <span className="text-[10px] text-primary font-extrabold block mt-1">Favorit pelanggan</span>
                </div>
              </div>

            </div>

            {/* CHART: REVENUE TREND (7 days) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              <div className="bg-card border border-border rounded-md p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                  <div>
                    <h4 className="font-display text-sm font-extrabold text-foreground">Grafik Penjualan 7 Hari</h4>
                    <p className="text-[10px] text-muted-foreground">Omzet harian stan kamu.</p>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded font-extrabold uppercase tracking-wider">Line</span>
                </div>

                <div className="h-64">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.chartData || []}>
                        <defs>
                          <linearGradient id="colorTenantRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c2410c" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#c2410c" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                        <XAxis dataKey="tanggal" stroke="currentColor" opacity={0.5} fontSize={10} tickLine={false} />
                        <YAxis stroke="currentColor" opacity={0.5} fontSize={10} tickLine={false} tickFormatter={(v) => `Rp ${v / 1000}k`} />
                        <Tooltip
                          formatter={(v: unknown) => [formatRupiah(Number(v ?? 0)), "Omzet"]}
                          contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "11px" }}
                        />
                        <Area type="monotone" dataKey="pendapatan" stroke="#c2410c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTenantRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-5 flex flex-col justify-between">
                <div>
                  <h4 className="font-display text-sm font-extrabold text-foreground">Transaksi Terkini</h4>
                  <p className="text-[10px] text-muted-foreground border-b border-border pb-3 mb-3">5 order terbaru stan kamu.</p>

                  <div className="space-y-3.5">
                    {(stats?.recentTransactions || []).map((tx: Transaction) => (
                      <div key={tx.id} className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-extrabold text-foreground block font-mono">{tx.id}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(tx.tanggal_transaksi).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} — {tx.metode_pembayaran}
                          </span>
                        </div>
                        <span className="font-extrabold text-foreground">{formatRupiah(tx.total_harga)}</span>
                      </div>
                    ))}
                    {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
                      <div className="text-center py-10 text-muted-foreground text-xs">Belum ada transaksi hari ini</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => router.push("/tenant/cashier")}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    Buka Mesin Kasir
                  </button>
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
