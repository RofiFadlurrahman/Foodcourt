"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Transaction, Tenant, Menu } from "@/services/dbSimulator";
import { getSessionTenant } from "@/lib/session";
import {
  ReceiptText, Search, Printer, FileSpreadsheet, CheckCircle
} from "lucide-react";

export default function TenantTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethodFilter, setSelectedMethodFilter] = useState("all");

  const [toastMessage, setToastMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const sessionTenant = getSessionTenant<Tenant>();
      if (!sessionTenant) return;
      setActiveTenant(sessionTenant);

      const txList = await dbSimulator.getTransactions();
      const menuList = await dbSimulator.getMenus();

      // Filter by active tenant and sort by date descending
      const tenantTxs = txList
        .filter(t => t.tenant_id === sessionTenant.id)
        .sort((a, b) => b.tanggal_transaksi.localeCompare(a.tanggal_transaksi));

      setTransactions(tenantTxs);
      setMenus(menuList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  };

  // Filter Logic
  const filteredTxs = transactions.filter(tx => {
    const matchedMenu = menus.find(m => m.id === tx.menu_id);
    const menuName = matchedMenu ? matchedMenu.nama_menu : "Menu Hidangan";
    
    const matchesSearch = tx.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          menuName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = selectedMethodFilter === "all" || tx.metode_pembayaran === selectedMethodFilter;
    
    return matchesSearch && matchesMethod;
  });

  // Export CSV
  const handleExportExcel = () => {
    if (filteredTxs.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,ID Transaksi,Menu,Jumlah,Total Harga,Metode Pembayaran,Tanggal\n";
    
    filteredTxs.forEach(tx => {
      const mName = menus.find(m => m.id === tx.menu_id)?.nama_menu || "Menu";
      const formattedDate = new Date(tx.tanggal_transaksi).toLocaleString("id-ID");
      csvContent += `"${tx.id}","${mName}",${tx.jumlah},${tx.total_harga},"${tx.metode_pembayaran}","${formattedDate}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Transaksi_${activeTenant?.nama_tenant.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Riwayat transaksi Excel (CSV) diunduh.");
  };

  return (
    <DashboardLayout roleRequired="tenant">
      <div className="space-y-6 print:p-0 print:m-0">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white rounded-xl p-4 shadow-xl flex items-center gap-3 animate-slide-up text-xs font-semibold print:hidden">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Riwayat Penjualan Outlet</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Daftar rekapan seluruh penjualan dan transaksi kasir digital Anda.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4 text-indigo-500" /> Cetak Data
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
        <div className="hidden print:block text-center space-y-2 border-b border-slate-300 pb-4 mb-6 font-mono">
          <h2 className="text-xl font-extrabold">LAPORAN TRANSAKSI - {activeTenant?.nama_tenant.toUpperCase()}</h2>
          <p className="text-xs">Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
          <p className="text-[10px] text-slate-500">Jumlah Transaksi: {filteredTxs.length} | Total Pendapatan: {formatRupiah(filteredTxs.reduce((a, b) => a + b.total_harga, 0))}</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between print:hidden">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari ID transaksi atau nama menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-transparent rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <select
              value={selectedMethodFilter}
              onChange={(e) => setSelectedMethodFilter(e.target.value)}
              className="bg-slate-100 border border-transparent dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:bg-slate-900/50 dark:text-white focus:outline-none"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="QRIS">QRIS</option>
              <option value="Debit">Debit</option>
              <option value="Cash">Cash</option>
              <option value="Midtrans">Midtrans</option>
            </select>
          </div>
          
          <div className="text-xs text-slate-500 font-bold">
            Total Omzet: <span className="text-indigo-500">{formatRupiah(filteredTxs.reduce((acc, curr) => acc + curr.total_harga, 0))}</span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
          {loading && transactions.length === 0 ? (
            <div className="space-y-4 animate-pulse py-10">
              <div className="h-6 bg-slate-800 rounded w-full" />
              <div className="h-6 bg-slate-800 rounded w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3">ID Transaksi</th>
                    <th className="py-3">Hidangan Menu</th>
                    <th className="py-3">Jumlah</th>
                    <th className="py-3">Total Harga</th>
                    <th className="py-3">Metode</th>
                    <th className="py-3 text-right">Tanggal Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                  {filteredTxs.map((tx) => {
                    const matchedMenu = menus.find(m => m.id === tx.menu_id);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/10">
                        <td className="py-3.5 font-bold text-slate-900 dark:text-white font-mono">{tx.id}</td>
                        <td className="py-3.5 font-semibold">
                          {matchedMenu ? matchedMenu.nama_menu : "Menu Hidangan"}
                        </td>
                        <td className="py-3.5 font-bold">{tx.jumlah} porsi</td>
                        <td className="py-3.5 font-extrabold text-slate-900 dark:text-white">{formatRupiah(tx.total_harga)}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.metode_pembayaran === "QRIS" ? "bg-cyan-500/15 text-cyan-400" :
                            tx.metode_pembayaran === "Debit" ? "bg-indigo-500/15 text-indigo-400" :
                            "bg-slate-500/15 text-slate-400"
                          }`}>
                            {tx.metode_pembayaran}
                          </span>
                        </td>
                        <td className="py-3.5 text-right text-slate-500">
                          {new Date(tx.tanggal_transaksi).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
