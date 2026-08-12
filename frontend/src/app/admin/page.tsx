"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Transaction } from "@/services/dbSimulator";
import { ReceiptText, Store, DollarSign, ArrowUpRight, Calendar, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Warm food court palette for charts
const COLORS = ["#c2410c", "#a16207", "#15803d", "#7c2d12", "#b45309"];

type AdminStats = Awaited<ReturnType<typeof dbSimulator.getAdminStats>>;

type TenantPerformanceData = {
  name: string;
  pendapatan: number;
};

type BestSellerData = {
  name: string;
  value: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await dbSimulator.getAdminStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsMounted(true);
      fetchData();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardLayout roleRequired="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">Dashboard Pengelola</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Ringkasan transaksi & omzet seluruh stan foodcourt.</p>
          </div>

          <button
            onClick={fetchData}
            className="self-start sm:self-auto bg-card hover:bg-muted text-foreground border border-border text-xs font-bold py-2.5 px-4 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: "3s" }} /> Segarkan Data
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-card border border-border rounded-md p-4 animate-pulse flex flex-col justify-between">
                  <div className="w-12 h-4 bg-muted rounded" />
                  <div className="w-24 h-8 bg-muted rounded mt-2" />
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="h-72 bg-card border border-border rounded-md animate-pulse" />
              <div className="h-72 bg-card border border-border rounded-md animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {/* 1. STATISTIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-md p-5 hover:border-primary transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Pendapatan</span>
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">{formatRupiah(stats?.totalRevenue || 0)}</h3>
                  <p className="text-[10px] text-success font-bold flex items-center gap-1 mt-1">
                    <span>▲ +14.2%</span> <span className="text-muted-foreground">dari minggu lalu</span>
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-5 hover:border-secondary transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Pendapatan Hari Ini</span>
                  <div className="p-2 rounded-md bg-secondary/15 text-secondary">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">{formatRupiah(stats?.revenueToday || 0)}</h3>
                  <p className="text-[10px] text-success font-bold flex items-center gap-1 mt-1">
                    <span>▲ +8.5%</span> <span className="text-muted-foreground">dari kemarin</span>
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-5 hover:border-accent transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Order</span>
                  <div className="p-2 rounded-md bg-accent/15 text-accent">
                    <ReceiptText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">{stats?.totalTransactions || 0} Order</h3>
                  <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 mt-1">
                    <span>Dari {stats?.totalTenants || 0} stan aktif</span>
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-5 hover:border-warning transition-colors">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Stan Aktif</span>
                  <div className="p-2 rounded-md bg-warning/15 text-warning">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">{stats?.totalTenants || 0} Stan</h3>
                  <p className="text-[10px] text-success font-bold flex items-center gap-1 mt-1">
                    <span>Semua stan online</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2. MAIN CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-card border border-border rounded-md p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-display text-sm font-extrabold text-foreground">Tren Pendapatan 7 Hari</h4>
                    <p className="text-[10px] text-muted-foreground">Omzet foodcourt minggu ini.</p>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">Line</span>
                </div>
                <div className="h-64">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.lineChartData || []}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c2410c" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#c2410c" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                        <XAxis dataKey="tanggal" stroke="currentColor" opacity={0.5} fontSize={10} tickLine={false} />
                        <YAxis stroke="currentColor" opacity={0.5} fontSize={10} tickLine={false} tickFormatter={(v) => `Rp ${v / 1000}k`} />
                        <Tooltip
                          formatter={(value) => [formatRupiah(Number(value)), "Pendapatan"]}
                          contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "11px" }}
                        />
                        <Area type="monotone" dataKey="pendapatan" stroke="#c2410c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-display text-sm font-extrabold text-foreground">Performa Stan</h4>
                    <p className="text-[10px] text-muted-foreground">Omzet masing-masing stan.</p>
                  </div>
                  <span className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">Bar</span>
                </div>
                <div className="h-64">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.barChartTenantPerformance || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                        <XAxis dataKey="name" stroke="currentColor" opacity={0.5} fontSize={9} tickLine={false} />
                        <YAxis stroke="currentColor" opacity={0.5} fontSize={10} tickLine={false} tickFormatter={(v) => `Rp ${v / 1000}k`} />
                        <Tooltip
                          formatter={(value: string | number | readonly (string | number)[] | undefined) => {
                            const numericValue = Array.isArray(value) ? Number(value[0]) : Number(value ?? 0);
                            return [formatRupiah(numericValue), "Pendapatan"];
                          }}
                          contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "11px" }}
                        />
                        <Bar dataKey="pendapatan" fill="#a16207" radius={[4, 4, 0, 0]}>
                          {(stats?.barChartTenantPerformance || []).map((entry: TenantPerformanceData, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-card border border-border rounded-md p-5 lg:col-span-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-display text-sm font-extrabold text-foreground">5 Menu Terlaris</h4>
                  <p className="text-[10px] text-muted-foreground mb-4">Porsi terjual minggu ini.</p>

                  <div className="h-44 relative flex items-center justify-center">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stats?.pieChartBestSellers || []} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                            {(stats?.pieChartBestSellers || []).map((entry: BestSellerData, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "11px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  {(stats?.pieChartBestSellers || []).slice(0, 3).map((item: BestSellerData, idx: number) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-foreground/80">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-semibold truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-extrabold text-foreground">{item.value} porsi</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-display text-sm font-extrabold text-foreground">Transaksi Terbaru</h4>
                    <p className="text-[10px] text-muted-foreground">Order terbaru dari seluruh stan.</p>
                  </div>
                  <Link href="/admin/transactions" className="text-xs font-extrabold text-primary hover:underline flex items-center gap-0.5">
                    Semua Transaksi <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-extrabold">
                        <th className="py-2.5">ID Order</th>
                        <th className="py-2.5">Menu</th>
                        <th className="py-2.5">Jumlah</th>
                        <th className="py-2.5">Total</th>
                        <th className="py-2.5">Bayar</th>
                        <th className="py-2.5 text-right">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-foreground/85">
                      {(stats?.recentTransactions || []).map((tx: Transaction) => (
                        <tr key={tx.id} className="hover:bg-muted/40">
                          <td className="py-3 font-extrabold text-foreground">{tx.id}</td>
                          <td className="py-3 font-semibold">
                            {tx.menu_id === "m-1" ? "Bakso Urat Spesial"
                              : tx.menu_id === "m-2" ? "Mie Ayam Pangsit Bakso"
                              : tx.menu_id === "m-3" ? "Es Teh Manis Segar"
                              : tx.menu_id === "m-4" ? "Es Kopi Susu Senja"
                              : tx.menu_id === "m-5" ? "Classic Chocolate Ice"
                              : tx.menu_id === "m-6" ? "Roti Bakar Keju Meleleh"
                              : tx.menu_id === "m-7" ? "Salmon Mentai Roll"
                              : tx.menu_id === "m-8" ? "Chicken Katsu Curry"
                              : tx.menu_id === "m-9" ? "Ocha Green Tea"
                              : "Menu Hidangan"}
                          </td>
                          <td className="py-3 font-semibold">{tx.jumlah}x</td>
                          <td className="py-3 font-extrabold text-foreground">{formatRupiah(tx.total_harga)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              tx.metode_pembayaran === "QRIS" ? "bg-accent/15 text-accent"
                              : tx.metode_pembayaran === "Debit" ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                            }`}>
                              {tx.metode_pembayaran}
                            </span>
                          </td>
                          <td className="py-3 text-right text-muted-foreground">
                            {new Date(tx.tanggal_transaksi).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
