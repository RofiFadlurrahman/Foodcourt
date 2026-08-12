"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Menu, Tenant } from "@/services/dbSimulator";
import { getSessionTenant } from "@/lib/session";
import {
  UtensilsCrossed, Plus, Pencil, Trash2, X, Save, CheckCircle, Search,
  ImagePlus, Upload, Loader2
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
  const [foto, setFoto] = useState(""); // URL gambar yang sudah tersimpan

  // ── State untuk upload gambar ──────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");   // Object URL untuk preview
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ──────────────────────────────────────────────────────────────────────────

  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const sessionTenant = getSessionTenant<Tenant>();
      if (!sessionTenant) return;
      setActiveTenant(sessionTenant);
      const allMenus = await dbSimulator.getMenus();
      const tenantMenus = allMenus.filter(m => m.tenant_id === sessionTenant.id);
      setMenus(tenantMenus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, []);

  // Bersihkan object URL saat komponen unmount agar tidak memory leak
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const resetImageState = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    setFoto("");
    resetImageState();
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
    setFoto(m.foto); // Gambar lama dari DB
    resetImageState(); // Reset pilihan file baru
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

  // ── Handler pilih file ─────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi format di frontend
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFormError("Format gambar tidak diizinkan. Gunakan JPG, JPEG, PNG, atau WEBP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Ukuran gambar terlalu besar. Maksimal 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFormError("");

    // Revoke URL lama agar tidak memory leak
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

    // Buat object URL untuk preview langsung
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };
  // ──────────────────────────────────────────────────────────────────────────

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

      // ── Jika ada file baru dipilih, upload dulu ──────────────────────────
      let finalFotoUrl = foto; // Default: gambar lama (edit) atau kosong (add)

      if (selectedFile) {
        setUploading(true);
        try {
          finalFotoUrl = await dbSimulator.uploadMenuImage(selectedFile);
        } catch (uploadErr: unknown) {
          const msg = uploadErr instanceof Error ? uploadErr.message : "Upload gagal.";
          setFormError("Gagal upload gambar: " + msg);
          setLoading(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      // Fallback jika tidak ada gambar sama sekali (tambah baru tanpa pilih file)
      if (!finalFotoUrl) {
        finalFotoUrl = "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=150&q=80";
      }
      // ─────────────────────────────────────────────────────────────────────

      const targetMenu: Menu = {
        id: modalMode === "edit" ? (activeMenuId || "") : "",
        tenant_id: activeTenant.id,
        nama_menu: namaMenu.trim(),
        harga,
        kategori,
        stok,
        status: stok === 0 ? "empty" : status,
        foto: finalFotoUrl,
      };

      await dbSimulator.saveMenu(targetMenu);
      showToast(modalMode === "add" ? "Menu berhasil ditambahkan." : "Informasi menu berhasil diperbarui.");
      setIsModalOpen(false);
      resetImageState();
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

  // Gambar yang ditampilkan di preview area modal
  const displayPreview = previewUrl || foto;

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
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=150&q=80";
                    }}
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
            
            <div className="relative w-full max-w-md bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-10 animate-scale-up max-h-[90vh] overflow-y-auto">
              
              <div className="p-5 border-b border-slate-200 dark:border-slate-800/40 flex items-center justify-between sticky top-0 bg-white dark:bg-[#0d1222] z-10">
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

                {/* ── UPLOAD GAMBAR ──────────────────────────────────────────── */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <ImagePlus className="w-3 h-3" /> Foto Menu
                    {modalMode === "edit" && !selectedFile && (
                      <span className="text-slate-500 normal-case font-normal ml-1">(kosongkan untuk pertahankan gambar lama)</span>
                    )}
                  </label>

                  {/* Preview Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full h-40 rounded-xl overflow-hidden border-2 border-dashed cursor-pointer transition-all group ${
                      displayPreview
                        ? "border-indigo-400/30 hover:border-indigo-400"
                        : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500"
                    }`}
                  >
                    {displayPreview ? (
                      <>
                        <img
                          src={displayPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        {/* Overlay saat hover */}
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <Upload className="w-5 h-5 text-white" />
                          <span className="text-white text-[10px] font-semibold">Ganti Gambar</span>
                        </div>
                        {/* Badge gambar baru */}
                        {selectedFile && (
                          <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Gambar Baru
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
                        <ImagePlus className="w-8 h-8" />
                        <span className="text-[11px] font-semibold text-center px-4">
                          Klik untuk pilih gambar<br />
                          <span className="text-[10px] font-normal">JPG, PNG, WEBP • Maks. 5MB</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Input file tersembunyi */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Info file terpilih + tombol hapus pilihan */}
                  {selectedFile ? (
                    <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-lg px-3 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Upload className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 truncate">
                          {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-indigo-400 shrink-0">
                          ({(selectedFile.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); resetImageState(); }}
                        className="ml-2 text-indigo-400 hover:text-rose-400 transition-colors shrink-0"
                        title="Batal pilih gambar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all"
                    >
                      <Upload className="w-3 h-3" /> Pilih File Gambar
                    </button>
                  )}
                </div>
                {/* ── END UPLOAD GAMBAR ───────────────────────────────────── */}

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
                      onChange={(e) => setKategori(e.target.value as 'Makanan' | 'Minuman' | 'Cemilan')}
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
                      onChange={(e) => setStatus(e.target.value as 'ready' | 'empty')}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                    >
                      <option value="ready">Ready (Tersedia)</option>
                      <option value="empty">Empty (Habis)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/40 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-bold py-2.5 px-4 rounded-xl"
                    disabled={uploading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 disabled:opacity-60 disabled:pointer-events-none"
                    disabled={uploading || loading}
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Mengupload...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Simpan Hidangan</>
                    )}
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
