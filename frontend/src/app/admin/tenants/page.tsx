"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Tenant, User, Invitation } from "@/services/dbSimulator";
import {
  Store, Plus, Pencil, Trash2, X, Save, Phone, Mail, User as UserIcon,
  Lock, CheckCircle, Search, KeyRound, Copy, RefreshCw, ShieldCheck, Clock
} from "lucide-react";

type TabType = "tenants" | "invitations";

export default function TenantManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("tenants");

  // ── Tenant State ─────────────────────────────────────────────────────────
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  // Form states
  const [namaTenant, setNamaTenant] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");
  const [hp, setHp] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [foto, setFoto] = useState("");

  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // ── Invitation State ──────────────────────────────────────────────────────
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tenantList, userList] = await Promise.all([
        dbSimulator.getTenants(),
        dbSimulator.getUsers(),
      ]);
      setTenants(tenantList);
      setUsers(userList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvitations = useCallback(async () => {
    try {
      setInvLoading(true);
      setInvError("");
      const list = await dbSimulator.getInvitations();
      setInvitations(list);
    } catch (e) {
      console.error(e);
      setInvError("Gagal memuat daftar kode undangan.");
    } finally {
      setInvLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "invitations") {
      void fetchInvitations();
    }
  }, [activeTab, fetchInvitations]);

  // ── Tenant Handlers ───────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setModalMode("add");
    setFormError("");
    setNamaTenant("");
    setNamaPemilik("");
    setHp("");
    setEmail("");
    setStatus("active");
    setUsername("");
    setPassword("");
    setFoto("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tenant: Tenant) => {
    setModalMode("edit");
    setFormError("");
    setActiveTenantId(tenant.id);
    setNamaTenant(tenant.nama_tenant);
    setNamaPemilik(tenant.nama_pemilik);
    setHp(tenant.hp);
    setEmail(tenant.email);
    setStatus(tenant.status);
    setFoto(tenant.foto);
    const linkedUser = users.find((u) => u.id === tenant.user_id);
    setUsername(linkedUser ? linkedUser.username : "");
    setPassword("");
    setIsModalOpen(true);
  };

  const handleDeleteTenant = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tenant ini beserta seluruh data menunya? Tindakan ini tidak dapat dibatalkan.")) {
      try {
        setLoading(true);
        const targetTenant = tenants.find((t) => t.id === id);
        if (targetTenant) {
          await dbSimulator.deleteUser(targetTenant.user_id);
        }
        await dbSimulator.deleteTenant(id);
        showToast("Tenant berhasil dihapus dari cloud database.");
        fetchData();
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus tenant.");
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!namaTenant.trim() || !namaPemilik.trim() || !hp.trim() || !email.trim() || !username.trim()) {
      setFormError("Semua kolom bertanda bintang (*) wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      if (modalMode === "add") {
        if (!password.trim()) {
          setFormError("Password wajib diisi untuk tenant baru.");
          setLoading(false);
          return;
        }
        const usernameExists = users.some((u) => u.username === username.trim().toLowerCase());
        if (usernameExists) {
          setFormError("Username sudah terdaftar. Gunakan username lain.");
          setLoading(false);
          return;
        }

        const newUser: User = {
          id: "",
          username: username.trim().toLowerCase(),
          role: "tenant",
          fullName: namaPemilik.trim(),
          email: email.trim(),
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        };
        const savedUser = await dbSimulator.saveUser(newUser);

        const newTenant: Tenant = {
          id: "",
          user_id: savedUser.id,
          nama_tenant: namaTenant.trim(),
          nama_pemilik: namaPemilik.trim(),
          hp: hp.trim(),
          email: email.trim(),
          status,
          foto: foto.trim() || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80",
        };
        await dbSimulator.saveTenant(newTenant);
        showToast("Tenant baru dan akun pengguna berhasil ditambahkan.");
      } else {
        const targetTenant = tenants.find((t) => t.id === activeTenantId);
        if (!targetTenant) return;

        const linkedUser = users.find((u) => u.id === targetTenant.user_id);
        if (linkedUser) {
          linkedUser.fullName = namaPemilik.trim();
          linkedUser.email = email.trim();
          linkedUser.username = username.trim().toLowerCase();
          if (password.trim()) {
            linkedUser.password = password.trim();
          }
          await dbSimulator.saveUser(linkedUser);
        }

        const updatedTenant: Tenant = {
          ...targetTenant,
          nama_tenant: namaTenant.trim(),
          nama_pemilik: namaPemilik.trim(),
          hp: hp.trim(),
          email: email.trim(),
          status,
          foto: foto.trim(),
        };
        await dbSimulator.saveTenant(updatedTenant);
        showToast("Informasi tenant berhasil diperbarui.");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Gagal menyimpan data.";
      setFormError(msg || "Gagal menyimpan data ke cloud database.");
      setLoading(false);
    }
  };

  // ── Invitation Handlers ───────────────────────────────────────────────────
  const handleGenerateInvitation = async () => {
    try {
      setInvLoading(true);
      await dbSimulator.generateInvitation();
      showToast("Kode undangan baru berhasil dibuat.");
      fetchInvitations();
    } catch (e) {
      console.error(e);
      alert("Gagal membuat kode undangan.");
      setInvLoading(false);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    if (confirm("Hapus kode undangan ini? Tenant yang belum mendaftar tidak bisa menggunakan kode ini lagi.")) {
      try {
        await dbSimulator.deleteInvitation(id);
        showToast("Kode undangan dihapus.");
        fetchInvitations();
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus kode undangan.");
      }
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      alert("Tidak bisa menyalin kode.");
    }
  };

  const getInvStatusBadge = (inv: Invitation) => {
    const isExpired = new Date(inv.expires_at) < new Date();
    if (inv.status === "used") return { label: "Terpakai", cls: "bg-slate-500/15 text-slate-400" };
    if (inv.status === "expired" || isExpired) return { label: "Kedaluwarsa", cls: "bg-rose-500/15 text-rose-400" };
    return { label: "Aktif", cls: "bg-emerald-500/15 text-emerald-400" };
  };

  // ─────────────────────────────────────────────────────────────────────────

  const filteredTenants = tenants.filter(
    (t) =>
      t.nama_tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nama_pemilik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <DashboardLayout roleRequired="admin">
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white rounded-xl p-4 shadow-xl flex items-center gap-3 animate-slide-up text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Tenant Foodcourt</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Kelola kemitraan outlet kuliner, status akun, dan kode undangan.</p>
          </div>

          {activeTab === "tenants" ? (
            <button
              onClick={handleOpenAddModal}
              className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Tambah Tenant Baru
            </button>
          ) : (
            <button
              onClick={handleGenerateInvitation}
              disabled={invLoading}
              className="self-start sm:self-auto bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-600/20 text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <KeyRound className="w-4 h-4" /> Generate Kode Undangan
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl p-1 w-fit border border-slate-200 dark:border-slate-800/40">
          <button
            onClick={() => setActiveTab("tenants")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "tenants"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Daftar Tenant ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab("invitations")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "invitations"
                ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Kode Undangan ({invitations.filter(i => i.status === "active").length} aktif)
          </button>
        </div>

        {/* ── TAB: TENANTS ─────────────────────────────────────────────────── */}
        {activeTab === "tenants" && (
          <>
            {/* Search */}
            <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama tenant atau pemilik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border border-transparent rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-bold">
                Menampilkan {filteredTenants.length} dari {tenants.length} Tenant
              </div>
            </div>

            {/* Tenant List */}
            {loading && tenants.length === 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 bg-white dark:bg-[#0d1222] rounded-2xl animate-pulse border border-slate-800/40" />
                ))}
              </div>
            ) : tenants.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                  <Store className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Belum Ada Tenant</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Anda belum memiliki tenant. Tambahkan tenant pertama Anda secara langsung, atau kirim kode undangan agar tenant bisa mendaftar sendiri.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleOpenAddModal}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Langsung
                  </button>
                  <button
                    onClick={() => setActiveTab("invitations")}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Buat Kode Undangan
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenants.map((tenant) => (
                  <div key={tenant.id} className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="relative h-32 bg-slate-800">
                      <img src={tenant.foto} alt={tenant.nama_tenant} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${tenant.status === "active" ? "bg-emerald-500/25 text-emerald-400" : "bg-rose-500/25 text-rose-400"}`}>
                          {tenant.status === "active" ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-4 text-white">
                        <h3 className="font-extrabold text-sm sm:text-base drop-shadow-md">{tenant.nama_tenant}</h3>
                        <span className="text-[10px] text-slate-300 font-semibold drop-shadow-md">Outlet ID: {tenant.id}</span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3.5 text-xs">
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                        <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Pemilik</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{tenant.nama_pemilik}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Nomor HP</span>
                          <span className="font-semibold">{tenant.hp}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Email</span>
                          <span className="font-semibold truncate block">{tenant.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/40 flex justify-end gap-2.5">
                      <button
                        onClick={() => handleOpenEditModal(tenant)}
                        className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all border border-slate-200 dark:border-slate-800 hover:text-indigo-300"
                        title="Ubah Profil Tenant"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-slate-200 dark:border-slate-800 hover:text-rose-300"
                        title="Hapus Tenant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB: INVITATIONS ─────────────────────────────────────────────── */}
        {activeTab === "invitations" && (
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-cyan-400 mb-0.5">Cara Kerja Kode Undangan</p>
                <p>Generate kode undangan, lalu bagikan ke calon tenant. Tenant memasukkan kode saat mendaftar di <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">/tenant/register</code>. Setiap kode hanya bisa dipakai satu kali dan berlaku 7 hari.</p>
              </div>
            </div>

            {invError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-semibold">
                {invError}
              </div>
            )}

            {invLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-white dark:bg-[#0d1222] rounded-xl animate-pulse border border-slate-800/40" />
                ))}
              </div>
            ) : invitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
                  <KeyRound className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Belum Ada Kode Undangan</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-5">
                  Buat kode undangan untuk diberikan kepada calon tenant Anda.
                </p>
                <button
                  onClick={handleGenerateInvitation}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Generate Kode Sekarang
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{invitations.length} kode undangan</span>
                  <button
                    onClick={fetchInvitations}
                    disabled={invLoading}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    title="Refresh"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {invitations.map((inv) => {
                    const badge = getInvStatusBadge(inv);
                    return (
                      <div key={inv.id} className="flex items-center justify-between p-4 gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                            <KeyRound className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <code className="text-sm font-extrabold tracking-widest text-slate-900 dark:text-white">{inv.code}</code>
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${badge.cls}`}>{badge.label}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Berlaku hingga: {new Date(inv.expires_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                              {inv.email && <span>📧 {inv.email}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {inv.status === "active" && (
                            <button
                              onClick={() => handleCopyCode(inv.code)}
                              className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all border border-slate-200 dark:border-slate-800"
                              title="Salin kode"
                            >
                              {copiedCode === inv.code ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteInvitation(inv.id)}
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-slate-200 dark:border-slate-800"
                            title="Hapus kode"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ADD / EDIT MODAL ──────────────────────────────────────────────── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative w-full max-w-lg bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-10 animate-scale-up max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{modalMode === "add" ? "Tambah Tenant Baru" : "Edit Informasi Tenant"}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4 text-xs sm:text-sm">
                {formError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-semibold">{formError}</div>}

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block border-b border-slate-800 pb-1">1. Informasi Outlet</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Nama Tenant *</label>
                      <input type="text" value={namaTenant} onChange={(e) => setNamaTenant(e.target.value)} placeholder="e.g. Bakso Wonogiri Eko" className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Nama Pemilik *</label>
                      <input type="text" value={namaPemilik} onChange={(e) => setNamaPemilik(e.target.value)} placeholder="e.g. Eko Prasetyo" className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Nomor HP *</label>
                      <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} placeholder="e.g. 08123456789" className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Email *</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. eko@wonogiri.com" className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">URL Foto Outlet</label>
                      <input type="text" value={foto} onChange={(e) => setFoto(e.target.value)} placeholder="URL foto Unsplash" className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Status Kemitraan</label>
                      <select value={status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as "active" | "inactive")} className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all">
                        <option value="active">Aktif (Operasional)</option>
                        <option value="inactive">Nonaktif (Suspended)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block border-b border-slate-800 pb-1">2. Kredensial Login Tenant</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" /> Username *</label>
                      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. warung_eko" className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all" disabled={modalMode === "edit"} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Password {modalMode === "edit" && "(Opsional)"}</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={modalMode === "edit" ? "Kosongkan jika tak diubah" : "Password akun"} className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/40 flex justify-end gap-2.5 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs">
                    Batal
                  </button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 text-xs">
                    <Save className="w-4 h-4" /> Simpan Data
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
