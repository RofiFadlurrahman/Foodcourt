"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Transaction } from "@/services/dbSimulator";
import { ReceiptText, Store, DollarSign, ArrowUpRight, Calendar, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Colors for Recharts pie cells
const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

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
            <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Analitik Pengelola</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Ringkasan real-time aktivitas transaksi, data tenant, dan penjualan cloud.</p>
          </div>

          <button
            onClick={fetchData}
            className="self-start sm:self-auto bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 dark:text-slate-100 border border-slate-200 dark:border-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: "3s" }} /> Segarkan Data
          </button>
        </div>

        {loading ? (
          // Skeleton loader for cards & grid
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 animate-pulse flex flex-col justify-between">
                  <div className="w-12 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-24 h-8 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="h-72 bg-white dark:bg-[#0d1222] rounded-2xl animate-pulse" />
              <div className="h-72 bg-white dark:bg-[#0d1222] rounded-2xl animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {/* 1. STATISTIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Pendapatan</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{formatRupiah(stats?.totalRevenue || 0)}</h3>
                  <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                    <span>▲ +14.2%</span> <span className="text-slate-400">dari minggu lalu</span>
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pendapatan Hari Ini</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{formatRupiah(stats?.revenueToday || 0)}</h3>
                  <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                    <span>▲ +8.5%</span> <span className="text-slate-400">dari kemarin</span>
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Transaksi Cloud</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <ReceiptText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats?.totalTransactions || 0} Order</h3>
                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-1">
                    <span>Tersebar di {stats?.totalTenants || 0} Tenant</span>
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tenant Aktif</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stats?.totalTenants || 0} Outlet</h3>
                  <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                    <span>Uptime 99.9% Cloud Sync</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2. MAIN CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart - Pendapatan 7 Hari */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tren Pendapatan Harian</h4>
                    <p className="text-[10px] text-slate-400">Fluktuasi omzet foodcourt 7 hari terakhir.</p>
                  </div>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold">Line Chart</span>
                </div>
                <div className="h-64">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.lineChartData || []}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                        <XAxis dataKey="tanggal" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `Rp ${v / 1000}k`} />
                        <Tooltip
                          formatter={(value) => [formatRupiah(Number(value)), "Pendapatan"]}
                          contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                          labelStyle={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold" }}
                          itemStyle={{ color: "#fff", fontSize: "11px" }}
                        />
                        <Area type="monotone" dataKey="pendapatan" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Bar Chart - Performa Tenant */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Performa Pendapatan Tenant</h4>
                    <p className="text-[10px] text-slate-400">Komparasi perolehan omzet masing-masing outlet.</p>
                  </div>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-semibold">Bar Chart</span>
                </div>
                <div className="h-64">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.barChartTenantPerformance || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `Rp ${v / 1000}k`} />
                        <Tooltip
                          formatter={(value: string | number | readonly (string | number)[] | undefined) => {
                            const numericValue = Array.isArray(value) ? Number(value[0]) : Number(value ?? 0);
                            return [formatRupiah(numericValue), "Pendapatan"];
                          }}
                          contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                          labelStyle={{ color: "#94a3b8", fontSize: "11px" }}
                          itemStyle={{ color: "#fff", fontSize: "11px" }}
                        />
                        <Bar dataKey="pendapatan" fill="#06b6d4" radius={[4, 4, 0, 0]}>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart - Menu Terlaris */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm lg:col-span-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">5 Menu Terlaris</h4>
                  <p className="text-[10px] text-slate-400 mb-4">Porsi menu terpopuler yang terjual.</p>

                  <div className="h-44 relative flex items-center justify-center">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stats?.pieChartBestSellers || []} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                            {(stats?.pieChartBestSellers || []).map((entry: BestSellerData, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} itemStyle={{ color: "#fff", fontSize: "11px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  {(stats?.pieChartBestSellers || []).slice(0, 3).map((item: BestSellerData, idx: number) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-medium truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{item.value} porsi</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions Table */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Transaksi Terbaru</h4>
                    <p className="text-[10px] text-slate-400">Daftar penjualan digital terbaru dari seluruh tenant.</p>
                  </div>
                  <Link href="/admin/transactions" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                    Semua Transaksi <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                        <th className="py-2.5">ID Order</th>
                        <th className="py-2.5">Menu</th>
                        <th className="py-2.5">Jumlah</th>
                        <th className="py-2.5">Total Harga</th>
                        <th className="py-2.5">Metode</th>
                        <th className="py-2.5 text-right">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                      {(stats?.recentTransactions || []).map((tx: Transaction) => (
                        <tr key={tx.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/10">
                          <td className="py-3 font-bold text-slate-900 dark:text-white">{tx.id}</td>
                          <td className="py-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {/* Quick dynamic lookup if name is not embedded */}
                              {tx.menu_id === "m-1"
                                ? "Bakso Urat Spesial"
                                : tx.menu_id === "m-2"
                                  ? "Mie Ayam Pangsit Bakso"
                                  : tx.menu_id === "m-3"
                                    ? "Es Teh Manis Segar"
                                    : tx.menu_id === "m-4"
                                      ? "Es Kopi Susu Senja"
                                      : tx.menu_id === "m-5"
                                        ? "Classic Chocolate Ice"
                                        : tx.menu_id === "m-6"
                                          ? "Roti Bakar Keju Meleleh"
                                          : tx.menu_id === "m-7"
                                            ? "Salmon Mentai Roll"
                                            : tx.menu_id === "m-8"
                                              ? "Chicken Katsu Curry"
                                              : tx.menu_id === "m-9"
                                                ? "Ocha Green Tea"
                                                : "Menu Hidangan"}
                            </span>
                          </td>
                          <td className="py-3 font-semibold">{tx.jumlah}x</td>
                          <td className="py-3 font-bold text-slate-900 dark:text-white">{formatRupiah(tx.total_harga)}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                tx.metode_pembayaran === "QRIS" ? "bg-cyan-500/10 text-cyan-400" : tx.metode_pembayaran === "Debit" ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-500/10 text-slate-400"
                              }`}
                            >
                              {tx.metode_pembayaran}
                            </span>
                          </td>
                          <td className="py-3 text-right text-slate-500">
                            {new Date(tx.tanggal_transaksi).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
