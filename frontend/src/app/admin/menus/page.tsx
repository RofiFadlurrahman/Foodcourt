"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Menu, Tenant } from "@/services/dbSimulator";
import { UtensilsCrossed, Plus, X, Save, CheckCircle, Search, Filter } from "lucide-react";
import AdminMenuCard from "@/components/AdminMenuCard";

export default function AdminMenuManagement() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenantFilter, setSelectedTenantFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form states
  const [namaMenu, setNamaMenu] = useState("");
  const [harga, setHarga] = useState(0);
  const [kategori, setKategori] = useState<"Makanan" | "Minuman" | "Cemilan">("Makanan");
  const [stok, setStok] = useState(50);
  const [status, setStatus] = useState<"ready" | "empty">("ready");
  const [tenantId, setTenantId] = useState("");
  const [foto, setFoto] = useState("");

  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const menuList = await dbSimulator.getMenus();
      const tenantList = await dbSimulator.getTenants();
      setMenus(menuList);
      setTenants(tenantList);
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

  const handleOpenAddModal = () => {
    setModalMode("add");
    setFormError("");
    setNamaMenu("");
    setHarga(15000);
    setKategori("Makanan");
    setStok(50);
    setStatus("ready");
    setTenantId(tenants[0]?.id || "");
    setFoto("https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=150&q=80");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m: Menu) => {
    setModalMode("edit");
    setFormError("");
    setActiveMenuId(m.id);
    setNamaMenu(m.nama_menu);
    setHarga(m.harga);
    setKategori(m.kategori);
    setStok(m.stok);
    setStatus(m.status);
    setTenantId(m.tenant_id);
    setFoto(m.foto);
    setIsModalOpen(true);
  };

  const handleDeleteMenu = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus menu ini?")) {
      try {
        setLoading(true);
        await dbSimulator.deleteMenu(id);
        showToast("Menu berhasil dihapus.");
        fetchData();
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus menu.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!namaMenu.trim() || harga <= 0 || !tenantId) {
      setFormError("Nama menu, harga yang valid, dan tenant wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const targetMenu: Menu = {
        id: modalMode === "edit" ? activeMenuId || "" : "",
        tenant_id: tenantId,
        nama_menu: namaMenu.trim(),
        harga,
        kategori,
        stok,
        status: stok === 0 ? "empty" : status,
        foto: foto.trim() || "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=150&q=80",
      };

      await dbSimulator.saveMenu(targetMenu);
      showToast(modalMode === "add" ? "Menu baru berhasil ditambahkan." : "Informasi menu berhasil diperbarui.");
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError("Gagal menyimpan menu ke database.");
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Filter logic
  const filteredMenus = menus.filter((m) => {
    const matchesSearch = m.nama_menu.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = selectedTenantFilter === "all" || m.tenant_id === selectedTenantFilter;
    const matchesCategory = selectedCategoryFilter === "all" || m.kategori === selectedCategoryFilter;
    return matchesSearch && matchesTenant && matchesCategory;
  });

  return (
    <DashboardLayout roleRequired="admin">
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white rounded-xl p-4 shadow-xl flex items-center gap-3 animate-slide-up text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Daftar Menu Hidangan Foodcourt</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Kelola seluruh sajian makanan, minuman, cemilan, harga, dan ketersediaan stok.</p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Tambah Menu Baru
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari hidangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-transparent rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Tenant Filter */}
            <select
              value={selectedTenantFilter}
              onChange={(e) => setSelectedTenantFilter(e.target.value)}
              className="bg-slate-100 border border-transparent dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:bg-slate-900/50 dark:text-white focus:outline-none"
            >
              <option value="all">Semua Tenant</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama_tenant}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-slate-100 border border-transparent dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:bg-slate-900/50 dark:text-white focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="Cemilan">Cemilan</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-bold self-end md:self-auto">
            Menampilkan {filteredMenus.length} dari {menus.length} Item Menu
          </div>
        </div>

        {/* Menu Grid */}
        {loading && menus.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMenus.map((menu) => {
              const matchedTenant = tenants.find((t) => t.id === menu.tenant_id);
              return <AdminMenuCard key={menu.id} menu={menu} tenant={matchedTenant} onEdit={handleOpenEditModal} onDelete={handleDeleteMenu} formatRupiah={formatRupiah} />;
            })}
          </div>
        )}

        {/* ADD / EDIT MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

            <div className="relative w-full max-w-md bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-10 animate-scale-up">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{modalMode === "add" ? "Tambah Menu Baru" : "Edit Menu Hidangan"}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
                {formError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-semibold">{formError}</div>}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Pemilik Tenant *</label>
                  <select
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                  >
                    <option value="" disabled>
                      Pilih Tenant...
                    </option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama_tenant}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Nama Menu Hidangan *</label>
                  <input
                    type="text"
                    value={namaMenu}
                    onChange={(e) => setNamaMenu(e.target.value)}
                    placeholder="e.g. Bakso Urat Spesial"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Harga Jual *</label>
                    <input
                      type="number"
                      value={harga}
                      onChange={(e) => setHarga(Number(e.target.value))}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Kategori</label>
                    <select
                      value={kategori}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setKategori(e.target.value as "Makanan" | "Minuman" | "Cemilan")}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                    >
                      <option value="Makanan">Makanan</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Cemilan">Cemilan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Stok Hidangan</label>
                    <input
                      type="number"
                      value={stok}
                      onChange={(e) => setStok(Number(e.target.value))}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Status Stok</label>
                    <select
                      value={status}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as "ready" | "empty")}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                    >
                      <option value="ready">Ready (Tersedia)</option>
                      <option value="empty">Empty (Habis)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">URL Foto Menu</label>
                  <input
                    type="text"
                    value={foto}
                    onChange={(e) => setFoto(e.target.value)}
                    placeholder="URL gambar hidangan"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/40 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-bold py-2.5 px-4 rounded-xl"
                  >
                    Batal
                  </button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5">
                    <Save className="w-4 h-4" /> Simpan Menu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
