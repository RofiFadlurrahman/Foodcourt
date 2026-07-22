"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Menu, Tenant } from "@/services/dbSimulator";
import { 
  UtensilsCrossed, Plus, Pencil, Trash2, X, Save, CheckCircle, Search
} from "lucide-react";

export default function TenantMenuManagement() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form states
  const [namaMenu, setNamaMenu] = useState("");
  const [harga, setHarga] = useState(0);
  const [kategori, setKategori] = useState<'Makanan' | 'Minuman' | 'Cemilan'>("Makanan");
  const [stok, setStok] = useState(50);
  const [status, setStatus] = useState<'ready' | 'empty'>("ready");
  const [foto, setFoto] = useState("");

  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get active tenant from session
      const sessionTenantStr = localStorage.getItem("session_tenant");
      if (!sessionTenantStr) return;
      const tenantObj = JSON.parse(sessionTenantStr) as Tenant;
      setActiveTenant(tenantObj);

      // Get all menus and filter by active tenant
      const allMenus = await dbSimulator.getMenus();
      const tenantMenus = allMenus.filter(m => m.tenant_id === tenantObj.id);
      setMenus(tenantMenus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleOpenAddModal = () => {
    if (!activeTenant) return;
    setModalMode("add");
    setFormError("");
    setNamaMenu("");
    setHarga(15000);
    setKategori("Makanan");
    setStok(50);
    setStatus("ready");
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
    setFoto(m.foto);
    setIsModalOpen(true);
  };

  const handleDeleteMenu = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus menu ini dari daftar Anda?")) {
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

    if (!activeTenant) return;

    if (!namaMenu.trim() || harga <= 0) {
      setFormError("Nama menu dan harga yang valid wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const targetMenu: Menu = {
        id: modalMode === "edit" ? (activeMenuId || "") : "",
        tenant_id: activeTenant.id,
        nama_menu: namaMenu.trim(),
        harga,
        kategori,
        stok,
        status: stok === 0 ? "empty" : status,
        foto: foto.trim() || "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=150&q=80"
      };

      await dbSimulator.saveMenu(targetMenu);
      showToast(modalMode === "add" ? "Menu berhasil ditambahkan." : "Informasi menu berhasil diperbarui.");
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError("Gagal menyimpan data.");
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

  const filteredMenus = menus.filter(m => {
    const matchesSearch = m.nama_menu.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || m.kategori === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout roleRequired="tenant">
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
            <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Menu Hidangan</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Kelola hidangan yang Anda sajikan di outlet {activeTenant?.nama_tenant}.</p>
          </div>
          
          <button
            onClick={handleOpenAddModal}
            className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Tambah Menu Baru
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari menu hidangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-transparent rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-100 border border-transparent dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:bg-slate-900/50 dark:text-white focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="Cemilan">Cemilan</option>
            </select>
          </div>
          
          <div className="text-xs text-slate-500 font-bold">
            Menampilkan {filteredMenus.length} Hidangan
          </div>
        </div>

        {/* Menu Catalog */}
        {loading && menus.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-60 bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMenus.map((menu) => (
              <div 
                key={menu.id}
                className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative h-40 bg-slate-800">
                  <img 
                    src={menu.foto} 
                    alt={menu.nama_menu} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      menu.status === "ready" && menu.stok > 0 ? "bg-emerald-500/25 text-emerald-400" : "bg-rose-500/25 text-rose-400"
                    }`}>
                      {menu.status === "ready" && menu.stok > 0 ? "Ready" : "Habis"}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-3">
                    <span className="px-2 py-0.5 rounded bg-slate-900/60 backdrop-blur-sm text-white text-[9px] font-semibold">{menu.kategori}</span>
                  </div>
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">{menu.nama_menu}</h3>
                  <div className="flex items-center justify-between text-xs pt-1.5">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(menu.harga)}</span>
                    <span className="text-slate-400">Stok: <b className="text-slate-700 dark:text-slate-300">{menu.stok}</b></span>
                  </div>
                </div>

                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/40 flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleOpenEditModal(menu)}
                    className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg border border-slate-200 dark:border-slate-800"
                    title="Edit Menu"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMenu(menu.id)}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-200 dark:border-slate-800"
                    title="Hapus Menu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
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
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {modalMode === "add" ? "Tambah Menu Hidangan" : "Edit Hidangan"}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-semibold">
                    {formError}
                  </div>
                )}

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
                      onChange={(e) => setKategori(e.target.value as any)}
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
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Stok Tersedia</label>
                    <input 
                      type="number" 
                      value={stok}
                      onChange={(e) => setStok(Number(e.target.value))}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Status Ketersediaan</label>
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                    >
                      <option value="ready">Ready (Tersedia)</option>
                      <option value="empty">Empty (Habis)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">URL Gambar Foto</label>
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
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Simpan Hidangan
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
