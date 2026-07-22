"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Transaction, Tenant, Menu } from "@/services/dbSimulator";
import { LineChart as LineIcon, Calendar, Store, Filter, TrendingUp, Clock, Award, Users, RefreshCw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#f43f5e"];

type RevenueTrendData = {
  tanggal: string;
  pendapatan: number;
};

type TenantComparisonData = {
  id: string;
  name: string;
  pendapatan: number;
  transaksi: number;
};

type HourlyDistributionData = {
  label: string;
  hour: number;
  transaksi: number;
};

type BestSellerData = {
  name: string;
  value: number;
};

export default function AnalyticsDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Default to last 7 days
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [selectedTenant, setSelectedTenant] = useState("all");

  const filteredTransactions = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter((tx) => {
      const txDate = new Date(tx.tanggal_transaksi);
      const matchesDate = txDate >= start && txDate <= end;
      const matchesTenant = selectedTenant === "all" || tx.tenant_id === selectedTenant;
      return matchesDate && matchesTenant;
    });
  }, [transactions, startDate, endDate, selectedTenant]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((acc, curr) => acc + curr.total_harga, 0);
    const totalOrders = filteredTransactions.length;
    const totalQtySold = filteredTransactions.reduce((acc, curr) => acc + curr.jumlah, 0);

    return {
      totalRevenue,
      averageTxValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalOrders,
      totalQtySold,
    };
  }, [filteredTransactions]);

  const revenueTrend = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const trendMap = new Map<string, number>();
    const tempDate = new Date(start);
    while (tempDate <= end) {
      const dateKey = tempDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      trendMap.set(dateKey, 0);
      tempDate.setDate(tempDate.getDate() + 1);
    }

    filteredTransactions.forEach((tx) => {
      const dateKey = new Date(tx.tanggal_transaksi).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      trendMap.set(dateKey, (trendMap.get(dateKey) ?? 0) + tx.total_harga);
    });

    return Array.from(trendMap.entries()).map(([tanggal, pendapatan]) => ({ tanggal, pendapatan }));
  }, [filteredTransactions, startDate, endDate]);

  const tenantComparison = useMemo(() => {
    const tenantMap = new Map<string, { revenue: number; txCount: number }>();
    tenants.forEach((t) => tenantMap.set(t.id, { revenue: 0, txCount: 0 }));

    filteredTransactions.forEach((tx) => {
      const current = tenantMap.get(tx.tenant_id) || { revenue: 0, txCount: 0 };
      tenantMap.set(tx.tenant_id, {
        revenue: current.revenue + tx.total_harga,
        txCount: current.txCount + 1,
      });
    });

    return Array.from(tenantMap.entries())
      .map(([tId, stat]) => ({
        id: tId,
        name: tenants.find((t) => t.id === tId)?.nama_tenant || "Tenant",
        pendapatan: stat.revenue,
        transaksi: stat.txCount,
      }))
      .filter((t) => selectedTenant === "all" || t.id === selectedTenant);
  }, [filteredTransactions, tenants, selectedTenant]);

  const hourlyDistribution = useMemo(() => {
    const hours = Array.from({ length: 15 }, (_, i) => {
      const hr = 8 + i; // 8:00 to 22:00
      return {
        label: `${hr.toString().padStart(2, "0")}:00`,
        hour: hr,
        transaksi: 0,
      };
    });

    filteredTransactions.forEach((tx) => {
      const txHour = new Date(tx.tanggal_transaksi).getHours();
      const matched = hours.find((h) => h.hour === txHour);
      if (matched) {
        matched.transaksi += 1;
      }
    });

    return hours;
  }, [filteredTransactions]);

  const bestSellers = useMemo(() => {
    const menuMap = new Map<string, number>();
    filteredTransactions.forEach((tx) => {
      menuMap.set(tx.menu_id, (menuMap.get(tx.menu_id) || 0) + tx.jumlah);
    });

    return Array.from(menuMap.entries())
      .map(([mId, qty]) => ({
        name: menus.find((m) => m.id === mId)?.nama_menu || "Hidangan",
        value: qty,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredTransactions, menus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const txs = await dbSimulator.getTransactions();
      const tnts = await dbSimulator.getTenants();
      const mns = await dbSimulator.getMenus();
      setTransactions(txs);
      setTenants(tnts);
      setMenus(mns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const txs = await dbSimulator.getTransactions();
        const tnts = await dbSimulator.getTenants();
        const mns = await dbSimulator.getMenus();
        setTransactions(txs);
        setTenants(tnts);
        setMenus(mns);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleResetFilters = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setStartDate(d.toISOString().slice(0, 10));
    setEndDate(new Date().toISOString().slice(0, 10));
    setSelectedTenant("all");
  };

  return (
    <DashboardLayout roleRequired="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Pusat Dashboard Analitik</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Analisis tren penjualan mendalam, perbandingan kinerja tenant, dan jam sibuk operasional.</p>
          </div>

          <button
            onClick={handleResetFilters}
            className="self-start sm:self-auto bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> Reset Filter
          </button>
        </div>

        {/* Dynamic Analytics Filter Form */}
        <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-indigo-500" /> Saring & Filter Data Penjualan
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tenant Selection */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> Filter Tenant Outlet
              </label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Semua Tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama_tenant}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {/* DYNAMIC CARDS STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Omzet Terfilter</span>
                <span className="text-lg sm:text-xl font-black block mt-2 text-slate-900 dark:text-white">{formatRupiah(metrics.totalRevenue)}</span>
              </div>

              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Nilai Rata-rata Order</span>
                <span className="text-lg sm:text-xl font-black block mt-2 text-slate-900 dark:text-white">{formatRupiah(metrics.averageTxValue)}</span>
              </div>

              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Transaksi</span>
                <span className="text-lg sm:text-xl font-black block mt-2 text-slate-900 dark:text-white">{metrics.totalOrders} Order</span>
              </div>

              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Porsi Menu Terjual</span>
                <span className="text-lg sm:text-xl font-black block mt-2 text-slate-900 dark:text-white">{metrics.totalQtySold} Porsi</span>
              </div>
            </div>

            {/* CHART 1: AREA TREN PENJUALAN */}
            <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/20 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    Tren Grafik Penjualan Periodik
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Menganalisis kenaikan atau penurunan omzet harian dalam rentang tanggal terfilter.</p>
                </div>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">Area Chart</span>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="colorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                    <XAxis dataKey="tanggal" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `Rp ${v / 1000}k`} />
                    <Tooltip
                      formatter={(value: unknown) => [formatRupiah(Number(value ?? 0)), "Pendapatan"]}
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold" }}
                      itemStyle={{ color: "#fff", fontSize: "11px" }}
                    />
                    <Area type="monotone" dataKey="pendapatan" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenueGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* OTHER CHARTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 2: Perbandingan Tenant */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <Store className="w-4 h-4 text-indigo-500" />
                    Komparasi Pendapatan Antar Tenant
                  </h3>
                  <p className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800/20 pb-3 mb-4">Grafik total perolehan omzet masing-masing outlet kuliner.</p>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tenantComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `Rp ${v / 1000}k`} />
                      <Tooltip
                        formatter={(value: unknown) => [formatRupiah(Number(value ?? 0)), "Pendapatan"]}
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                        itemStyle={{ color: "#fff", fontSize: "11px" }}
                      />
                      <Bar dataKey="pendapatan" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                        {tenantComparison.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Jam Penjualan Terpadat */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Jam Penjualan Terpadat (Peak Hours)
                  </h3>
                  <p className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800/20 pb-3 mb-4">Analisis grafik jam sibuk berdasarkan volume transaksi masuk.</p>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(value) => [value ?? 0, "Transaksi"]} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} itemStyle={{ color: "#fff", fontSize: "11px" }} />
                      <Bar dataKey="transaksi" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Menu Terlaris (Pie) */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <Award className="w-4 h-4 text-indigo-500" />
                    Pangsa Menu Terlaris (Top 5)
                  </h3>
                  <p className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800/20 pb-3 mb-4">Volume porsi menu hidangan yang paling sering diorder.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={bestSellers} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                          {bestSellers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} itemStyle={{ color: "#fff", fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {bestSellers.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="font-semibold truncate max-w-[120px]">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{item.value} porsi</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Card Info */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-xs">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Ikhtisar Operasional Cloud
                  </h3>
                  <p className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800/20 pb-3 mb-4">Catatan status kehandalan arsitektur database cloud.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/20 pb-2">
                    <span className="text-slate-400 font-bold">Sinkronisasi Otomatis</span>
                    <span className="text-emerald-500 font-bold">Aktif (Real-Time)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/20 pb-2">
                    <span className="text-slate-400 font-bold">Cloud Provider Uptime</span>
                    <span className="text-emerald-500 font-bold">99.98%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/20 pb-2">
                    <span className="text-slate-400 font-bold">Rata-rata Latensi Sync</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">&lt; 350 ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Laju Transaksi Per Jam</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">~ 18 Transaksi</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-[10px] text-indigo-400 leading-relaxed font-semibold">
                  Sistem Informasi ini mensimulasikan query database cloud multi-tenant yang efisien dan minim overhead bandwidth. Strukturnya fully-compatible untuk dihubungkan langsung ke Supabase SDK atau Firebase SDK.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
