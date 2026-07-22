"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Tenant, Transaction } from "@/services/dbSimulator";
import { 
  TrendingUp, ReceiptText, UtensilsCrossed, Calendar, 
  DollarSign, ShoppingBag, Sparkles, Activity, CreditCard
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from "recharts";

export default function TenantDashboard() {
  const router = useRouter();
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const sessionTenantStr = localStorage.getItem("session_tenant");
      if (!sessionTenantStr) return;
      const tenantObj = JSON.parse(sessionTenantStr) as Tenant;
      setActiveTenant(tenantObj);

      const tenantStats = await dbSimulator.getTenantStats(tenantObj.id);
      setStats(tenantStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              Halo, {activeTenant?.nama_pemilik} <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">Selamat datang di Panel Outlet <b className="text-slate-700 dark:text-slate-300 font-bold">{activeTenant?.nama_tenant}</b>. Pantau penjualan real-time Anda.</p>
          </div>
          
          <button 
            onClick={fetchData} 
            className="self-start sm:self-auto bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/85 dark:text-slate-100 border border-slate-200 dark:border-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: "3s" }} /> Segarkan
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-800 rounded-2xl" />
              ))}
            </div>
            <div className="h-72 bg-slate-800 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Revenue Today */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pendapatan Hari Ini</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {formatRupiah(stats?.revenueToday || 0)}
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-1">Update otomatis tiap detik</span>
                </div>
              </div>

              {/* Revenue Month */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pendapatan Bulan Ini</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {formatRupiah(stats?.revenueThisMonth || 0)}
                  </h3>
                  <span className="text-[10px] text-emerald-500 font-semibold block mt-1">▲ +8.2% vs Bulan Lalu</span>
                </div>
              </div>

              {/* Total Transactions */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Penjualan</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {stats?.totalSalesCount || 0} Transaksi
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-1">Total pesanan terproses</span>
                </div>
              </div>

              {/* Top Menu */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Menu Terlaris</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-md sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                    {stats?.bestSellerMenu || "Tidak Ada"}
                  </h3>
                  <span className="text-[10px] text-indigo-400 font-bold block mt-1">Hidangan Favorit Pelanggan</span>
                </div>
              </div>

            </div>

            {/* CHART: REVENUE TREND (7 days) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily revenue Line Chart */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/20 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Grafik Penjualan 7 Hari Terakhir</h4>
                    <p className="text-[10px] text-slate-400">Statistik omzet harian outlet Anda.</p>
                  </div>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded font-bold">Line Chart</span>
                </div>
                
                <div className="h-64">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.chartData || []}>
                        <defs>
                          <linearGradient id="colorTenantRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                        <XAxis dataKey="tanggal" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickLine={false}
                          tickFormatter={(v) => `Rp ${v / 1000}k`}
                        />
                        <Tooltip 
                          formatter={(v: any) => [formatRupiah(v), "Omzet"]}
                          contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                          labelStyle={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold" }}
                          itemStyle={{ color: "#fff", fontSize: "11px" }}
                        />
                        <Area type="monotone" dataKey="pendapatan" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTenantRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Recent Transactions List (max 5) */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Transaksi Terkini</h4>
                  <p className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800/20 pb-3 mb-3">5 Order terbaru dari outlet Anda.</p>
                  
                  <div className="space-y-3.5">
                    {(stats?.recentTransactions || []).map((tx: Transaction) => (
                      <div key={tx.id} className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block font-mono">{tx.id}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(tx.tanggal_transaksi).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })} - {tx.metode_pembayaran}
                          </span>
                        </div>
                        <span className="font-extrabold text-slate-900 dark:text-white">{formatRupiah(tx.total_harga)}</span>
                      </div>
                    ))}
                    {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
                      <div className="text-center py-10 text-slate-500">Belum ada transaksi hari ini</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/30">
                  <button 
                    onClick={() => router.push("/tenant/cashier")}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Buka Mesin Kasir (POS)
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
