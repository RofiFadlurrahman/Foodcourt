"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, User } from "@/services/dbSimulator";
import { getSessionUser } from "@/lib/session";
import {
  Users, Plus, Pencil, Trash2, X, Save, Mail,
  User as UserIcon, Lock, CheckCircle, Search, ShieldCheck
} from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "tenant">("admin");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");

  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await dbSimulator.getUsers();
      setUsers(data);
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
    setFullName("");
    setUsername("");
    setEmail("");
    setRole("admin");
    setPassword("");
    setAvatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    setModalMode("edit");
    setFormError("");
    setActiveUserId(u.id);
    setFullName(u.fullName);
    setUsername(u.username);
    setEmail(u.email);
    setRole(u.role);
    setPassword("");
    setAvatar(u.avatar);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    // Prevent self deletion
    const activeUser = getSessionUser<User>();
    if (activeUser) {
      if (activeUser.id === id) {
        alert("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.");
        return;
      }
    }

    if (confirm("Apakah Anda yakin ingin menghapus pengguna ini? Pengguna ini tidak akan bisa login lagi.")) {
      try {
        setLoading(true);
        await dbSimulator.deleteUser(id);
        showToast("Pengguna berhasil dihapus.");
        fetchData();
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus pengguna.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim() || !username.trim() || !email.trim()) {
      setFormError("Semua kolom bertanda bintang (*) wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      if (modalMode === "add") {
        if (!password.trim()) {
          setFormError("Password wajib diisi untuk pengguna baru.");
          setLoading(false);
          return;
        }

        // Username duplicate check
        const userExists = users.some(u => u.username === username.trim().toLowerCase());
        if (userExists) {
          setFormError("Username sudah digunakan.");
          setLoading(false);
          return;
        }

        const newUser: User = {
          id: "",
          username: username.trim().toLowerCase(),
          role,
          fullName: fullName.trim(),
          email: email.trim(),
          avatar: avatar.trim() || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
        };
        await dbSimulator.saveUser(newUser);
        showToast("Pengguna baru berhasil dibuat.");
      } else {
        // Edit Mode
        const targetUser = users.find(u => u.id === activeUserId);
        if (!targetUser) return;

        const updatedUser: User = {
          ...targetUser,
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim(),
          role,
          avatar: avatar.trim()
        };
        await dbSimulator.saveUser(updatedUser);
        showToast("Informasi pengguna berhasil diperbarui.");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError("Gagal menyimpan data.");
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout roleRequired="admin">
      <div className="space-y-6">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white rounded-xl p-4 shadow-xl flex items-center gap-3 animate-slide-up text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Kelola hak akses sistem, akun pengelola, dan akun kasir tenant.</p>
          </div>
          
          <button
            onClick={handleOpenAddModal}
            className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Tambah Pengguna Baru
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-transparent rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          
          <div className="text-[10px] sm:text-xs text-slate-500 font-bold">
            Menampilkan {filteredUsers.length} dari {users.length} Akun Pengguna
          </div>
        </div>

        {/* Table of Users */}
        <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm overflow-hidden">
          {loading && users.length === 0 ? (
            <div className="space-y-4 animate-pulse py-8">
              <div className="h-6 bg-slate-800 rounded w-full" />
              <div className="h-6 bg-slate-800 rounded w-full" />
              <div className="h-6 bg-slate-800 rounded w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3">Pengguna</th>
                    <th className="py-3">Username</th>
                    <th className="py-3">Email</th>
                    <th className="py-3">Peran (Role)</th>
                    <th className="py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/10">
                      <td className="py-3.5 flex items-center gap-3">
                        <img 
                          src={u.avatar} 
                          alt={u.fullName}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <span className="font-bold text-slate-900 dark:text-white">{u.fullName}</span>
                      </td>
                      <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">@{u.username}</td>
                      <td className="py-3.5">{u.email}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "admin" ? "bg-indigo-500/15 text-indigo-400" : "bg-cyan-500/15 text-cyan-400"
                        }`}>
                          {u.role === "admin" ? "Admin" : "Tenant"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg border border-slate-200 dark:border-slate-800"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-200 dark:border-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ADD / EDIT MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <div className="relative w-full max-w-md bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-10 animate-scale-up">
              
              <div className="p-5 border-b border-slate-200 dark:border-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {modalMode === "add" ? "Tambah Akun Pengguna" : "Ubah Informasi Akun"}
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
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Nama Lengkap *</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Administrator Utama"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Username *</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin_baru"
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                      disabled={modalMode === "edit"}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Role Pengguna</label>
                    <select 
                      value={role}
                      onChange={(e) => setRole(e.target.value as "admin" | "tenant")}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                      disabled={modalMode === "edit" && role === "tenant"} // protect tenant role modifications
                    >
                      <option value="admin">Administrator</option>
                      <option value="tenant">Tenant</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Email *</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@foodcourt.cloud"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Password {modalMode === "edit" && "(Opsional)"}</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={modalMode === "edit" ? "Sama seperti lama" : "Password akun"}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">URL Avatar</label>
                    <input 
                      type="text" 
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="URL foto profil"
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
                    />
                  </div>
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
                    <Save className="w-4 h-4" /> Simpan
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
