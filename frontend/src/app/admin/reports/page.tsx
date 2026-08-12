"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Transaction, Tenant, Menu } from "@/services/dbSimulator";
import { FileText, Calendar, Store, UtensilsCrossed, Printer, FileSpreadsheet } from "lucide-react";

export default function ReportPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  // Report Period & Type Filters
  const [reportPeriod, setReportPeriod] = useState<"harian" | "mingguan" | "bulanan" | "tahunan">("mingguan");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedMenu, setSelectedMenu] = useState("all");

  // Filtered/grouped data for reporting
  type ReportRow = {
    tanggal: string;
    qty: number;
    revenue: number;
    txsCount: number;
    topMethod: string;
  };

  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [totals, setTotals] = useState({
    transactionsCount: 0,
    qtySold: 0,
    revenue: 0,
  });

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
    const timer = window.setTimeout(() => {
      fetchData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const generateReport = useCallback(() => {
    const now = new Date();
    const startDate = new Date();

    // Determine start date based on period filter
    if (reportPeriod === "harian") {
      startDate.setHours(0, 0, 0, 0); // Today only
    } else if (reportPeriod === "mingguan") {
      startDate.setDate(now.getDate() - 7); // Last 7 days
    } else if (reportPeriod === "bulanan") {
      startDate.setMonth(now.getMonth() - 1); // Last 30 days
    } else if (reportPeriod === "tahunan") {
      startDate.setFullYear(now.getFullYear() - 1); // Last 365 days
    }

    // Filter transactions
    const filteredTxs = transactions.filter((tx) => {
      const txDate = new Date(tx.tanggal_transaksi);
      const inDateRange = txDate >= startDate && txDate <= now;
      const matchesTenant = selectedTenant === "all" || tx.tenant_id === selectedTenant;
      const matchesMenu = selectedMenu === "all" || tx.menu_id === selectedMenu;
      return inDateRange && matchesTenant && matchesMenu;
    });

    // Grouping by Date for visual reporting
    const dateGroups = new Map<string, { qty: number; revenue: number; txsCount: number; paymentMethods: Record<string, number> }>();

    filteredTxs.forEach((tx) => {
      const dateKey = new Date(tx.tanggal_transaksi).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const current = dateGroups.get(dateKey) || { qty: 0, revenue: 0, txsCount: 0, paymentMethods: {} };
      current.qty += tx.jumlah;
      current.revenue += tx.total_harga;
      current.txsCount += 1;
      current.paymentMethods[tx.metode_pembayaran] = (current.paymentMethods[tx.metode_pembayaran] || 0) + tx.total_harga;

      dateGroups.set(dateKey, current);
    });

    const rows = Array.from(dateGroups.entries())
      .map(([date, data]) => {
        // Find top payment method
        let topMethod = "Cash";
        let maxVal = 0;
        Object.entries(data.paymentMethods).forEach(([method, val]) => {
          if (val > maxVal) {
            maxVal = val;
            topMethod = method;
          }
        });

        return {
          tanggal: date,
          qty: data.qty,
          revenue: data.revenue,
          txsCount: data.txsCount,
          topMethod,
        };
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal)); // sort date descending

    setReportRows(rows);

    // Calculate totals
    const totalRevenue = filteredTxs.reduce((acc, curr) => acc + curr.total_harga, 0);
    const totalQty = filteredTxs.reduce((acc, curr) => acc + curr.jumlah, 0);
    setTotals({
      transactionsCount: filteredTxs.length,
      qtySold: totalQty,
      revenue: totalRevenue,
    });
  }, [reportPeriod, selectedTenant, selectedMenu, transactions]);

  useEffect(() => {
    if (transactions.length > 0) {
      // avoid calling setState synchronously inside effect to prevent cascading renders
      const timer = window.setTimeout(() => {
        generateReport();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [generateReport, transactions.length]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleExportExcel = () => {
    if (reportRows.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,Tanggal,Jumlah Transaksi,Porsi Menu Terjual,Omzet Pendapatan,Metode Terbanyak\n";
    reportRows.forEach((row) => {
      csvContent += `"${row.tanggal}",${row.txsCount},${row.qty},${row.revenue},"${row.topMethod}"\n`;
    });
    // Add Totals Row
    csvContent += `"TOTAL",${totals.transactionsCount},${totals.qtySold},${totals.revenue},""\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Periodik_${reportPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout roleRequired="admin">
      <div className="space-y-6 print:p-0 print:m-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Pusat Laporan Penjualan</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Hasilkan laporan audit keuangan terformat untuk dinas koperasi, perbankan, maupun pembukuan skripsi.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4 text-indigo-500" /> Ekspor PDF (Print)
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-200" /> Ekspor Excel
            </button>
          </div>
        </div>

        {/* Print Layout Header */}
        <div className="hidden print:block text-center space-y-2 border-b border-slate-300 pb-5 mb-8 font-mono">
          <h2 className="text-xl font-extrabold">LAPORAN KINERJA KEUANGAN FOODCOURT CLOUDFOOD</h2>
          <p className="text-xs">
            Periode Laporan: {reportPeriod.toUpperCase()} | Dicetak pada: {new Date().toLocaleString("id-ID")}
          </p>
          {selectedTenant !== "all" && <p className="text-xs">Filter Tenant: {tenants.find((t) => t.id === selectedTenant)?.nama_tenant}</p>}
        </div>

        {/* Dynamic Filters Form */}
        <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm print:hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-indigo-500" /> Parameter Laporan Keuangan
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
            {/* Period */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Periode Laporan
              </label>
              <select
                value={reportPeriod}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportPeriod(e.target.value as "harian" | "mingguan" | "bulanan" | "tahunan")}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="harian">Laporan Hari Ini (Harian)</option>
                <option value="mingguan">Laporan 7 Hari Terakhir (Mingguan)</option>
                <option value="bulanan">Laporan 30 Hari Terakhir (Bulanan)</option>
                <option value="tahunan">Laporan 1 Tahun Terakhir (Tahunan)</option>
              </select>
            </div>

            {/* Tenant select */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> Tenant Terkait
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

            {/* Menu select */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <UtensilsCrossed className="w-3.5 h-3.5" /> Pilihan Menu Hidangan
              </label>
              <select
                value={selectedMenu}
                onChange={(e) => setSelectedMenu(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Semua Menu Hidangan</option>
                {/* Filter menu based on selected tenant first */}
                {menus
                  .filter((m) => selectedTenant === "all" || m.tenant_id === selectedTenant)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama_menu}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grouped report preview panel */}
        {loading ? (
          <div className="h-64 bg-slate-850 rounded-2xl animate-pulse" />
        ) : (
          <div className="space-y-6">
            {/* STATS SUMMARY BLOCKS */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Gross Omzet</span>
                <span className="text-base sm:text-xl font-black text-indigo-600 dark:text-indigo-400 block mt-2">{formatRupiah(totals.revenue)}</span>
              </div>

              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Porsi Terjual</span>
                <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white block mt-2">{totals.qtySold} Porsi</span>
              </div>

              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Volume Order</span>
                <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white block mt-2">{totals.transactionsCount} Order</span>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4 print:hidden">Tabel Rincian Harian Laporan Penjualan</span>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono">
                  <thead>
                    <tr className="border-b-2 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-extrabold text-[10px]">
                      <th className="py-2.5">Tanggal Operasional</th>
                      <th className="py-2.5">Volume Order</th>
                      <th className="py-2.5">Jumlah Terjual</th>
                      <th className="py-2.5">Metode Bayar Top</th>
                      <th className="py-2.5 text-right">Subtotal Omzet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                    {reportRows.map((row) => (
                      <tr key={row.tanggal} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/10">
                        <td className="py-3 font-semibold">{row.tanggal}</td>
                        <td className="py-3">{row.txsCount} Transaksi</td>
                        <td className="py-3 font-bold">{row.qty} porsi</td>
                        <td className="py-3 font-semibold">{row.topMethod}</td>
                        <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{formatRupiah(row.revenue)}</td>
                      </tr>
                    ))}
                    {/* TOTAL ROW */}
                    <tr className="bg-slate-100/60 dark:bg-slate-900/60 font-black border-t-2 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white">
                      <td className="py-3.5">TOTAL TERKONSOLIDASI</td>
                      <td className="py-3.5">{totals.transactionsCount} Transaksi</td>
                      <td className="py-3.5">{totals.qtySold} porsi</td>
                      <td className="py-3.5">-</td>
                      <td className="py-3.5 text-right text-indigo-500 font-extrabold text-sm sm:text-base">{formatRupiah(totals.revenue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
