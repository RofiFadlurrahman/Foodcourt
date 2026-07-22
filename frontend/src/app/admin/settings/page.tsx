"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, User } from "@/services/dbSimulator";
import { Settings, Cloud, UploadCloud, DownloadCloud, Save, User as UserIcon, Lock, Globe, Palette, Bell, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AdminSettings() {
  const initialSessionUser = (() => {
    if (typeof window === "undefined") return null;
    const sessionUserStr = localStorage.getItem("session_user");
    return sessionUserStr ? (JSON.parse(sessionUserStr) as User) : null;
  })();

  const initialThemeMode = (() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("foodcourt_theme") || "dark";
  })();

  const [user, setUser] = useState<User | null>(initialSessionUser);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Edit Profile States
  const [fullName, setFullName] = useState(initialSessionUser?.fullName ?? "");
  const [email, setEmail] = useState(initialSessionUser?.email ?? "");
  const [avatar, setAvatar] = useState(initialSessionUser?.avatar ?? "");

  // Change Password States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Preferences States
  const [language, setLanguage] = useState("id");
  const [themeMode, setThemeMode] = useState(initialThemeMode);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);

  // File Upload Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [themeMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!user) return;
    if (!fullName.trim() || !email.trim()) {
      setErrorMessage("Nama lengkap dan email wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const updatedUser: User = {
        ...user,
        fullName: fullName.trim(),
        email: email.trim(),
        avatar: avatar.trim(),
      };

      await dbSimulator.saveUser(updatedUser);
      localStorage.setItem("session_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      showToast("Profil admin berhasil diperbarui.");
    } catch (e) {
      console.error(e);
      setErrorMessage("Gagal menyimpan profil.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Harap lengkapi semua kolom password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password baru tidak cocok.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password berhasil diperbarui.");
    }, 600);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("foodcourt_theme", themeMode);
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    showToast("Preferensi pengaturan berhasil disimpan.");
  };

  // 1. CLOUD BACKUP EXPORT
  const handleCloudBackup = async () => {
    try {
      setLoading(true);
      const jsonBackup = await dbSimulator.exportBackup();

      const blob = new Blob([jsonBackup], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `CloudFood_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Database cloud berhasil diunduh.");
    } catch (e) {
      console.error(e);
      alert("Gagal melakukan backup cloud.");
    } finally {
      setLoading(false);
    }
  };

  // 2. CLOUD DATABASE RESTORE
  const handleCloudRestore = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const restored = await dbSimulator.importBackup(jsonContent);
        if (restored) {
          showToast("Database Cloud Berhasil Dipulihkan! Me-refresh halaman...");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setErrorMessage("File backup tidak valid atau rusak.");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Format file tidak valid.");
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

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

        {/* Hidden File Input for Restore */}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Pengaturan Sistem</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Konfigurasi preferensi global, kelola profil, dan lakukan pencadangan data cloud.</p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs sm:text-sm font-semibold">
          {/* Column 1: Profile & Password */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form Profile */}
            <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-indigo-500" /> Profil Administrator
              </span>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Nama Lengkap *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Email Administrator *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">URL Link Avatar Foto</label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 transition-all" disabled={loading}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Simpan Profil</span>
                </button>
              </form>
            </div>

            {/* Form Password */}
            <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-500" /> Perbarui Password Akun
              </span>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Password Lama *</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Password Baru *</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Konfirmasi Password Baru *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 transition-all" disabled={loading}>
                  <Save className="w-3.5 h-3.5" />
                  <span>Ubah Password</span>
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Backup Cloud & Preferences */}
          <div className="space-y-6">
            {/* Backup & Restore Cloud Box */}
            <div className="dark bg-[#090d16] text-slate-100 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between h-72">
              <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />

              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-cyan-400" /> Cloud Database Manager
                </span>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">Cadangkan data transaksi, menu, tenant, dan user pengakses foodcourt Anda ke file JSON lokal, atau pulihkan data kapan saja dari salinan cadangan.</p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-800/40">
                <button
                  onClick={handleCloudBackup}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  disabled={loading}
                >
                  <DownloadCloud className="w-4 h-4" /> Unduh Backup Cloud
                </button>

                <button
                  onClick={handleCloudRestore}
                  className="w-full bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  disabled={loading}
                >
                  <UploadCloud className="w-4 h-4" /> Unggah & Restore Cloud
                </button>
              </div>
            </div>

            {/* System Preferences */}
            <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-500" /> Preferensi Sistem
              </span>

              <form onSubmit={handleSavePreferences} className="space-y-4">
                {/* Language Select */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> Bahasa Sistem
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="id">Bahasa Indonesia (Default)</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>

                {/* Theme Select */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5" /> Tema Antarmuka
                  </label>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="dark">Dark Theme (Rekomendasi SaaS)</option>
                    <option value="light">Light Theme (Minimalis Terang)</option>
                  </select>
                </div>

                {/* Switch Low stock */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/30">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5" /> Peringatan Stok
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Beri notifikasi stok menu menipis</span>
                  </div>
                  <input type="checkbox" checked={lowStockAlerts} onChange={(e) => setLowStockAlerts(e.target.checked)} className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500" />
                </div>

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5 transition-all" disabled={loading}>
                  <Save className="w-4 h-4" />
                  <span>Simpan Preferensi</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
