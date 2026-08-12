"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, User } from "@/services/dbSimulator";
import { getSessionUser, setSessionUser } from "@/lib/session";
import { Settings, Cloud, UploadCloud, DownloadCloud, Save, User as UserIcon, Lock, Globe, Palette, Bell, CheckCircle, AlertCircle, Loader2, Upload, X, ImagePlus } from "lucide-react";

export default function AdminSettings() {
  const initialSessionUser = getSessionUser<User>();

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

  // ── State Upload Foto ──────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  // ──────────────────────────────────────────────────────────────────────────

  // Change Password States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Preferences States
  const [language, setLanguage] = useState("id");
  const [themeMode, setThemeMode] = useState(initialThemeMode);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);

  // File Upload Ref for Restore
  const restoreFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [themeMode]);

  // Cleanup preview URL
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

  const resetProfileImageState = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl("");
    if (profileFileInputRef.current) profileFileInputRef.current.value = "";
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrorMessage("Format foto tidak diizinkan. Gunakan JPG, JPEG, PNG, atau WEBP.");
      if (profileFileInputRef.current) profileFileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ukuran foto terlalu besar. Maksimal 5MB.");
      if (profileFileInputRef.current) profileFileInputRef.current.value = "";
      return;
    }

    setErrorMessage("");
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
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
      // ── Upload Foto Baru Jika Ada ───────────────────────────────────────────
      let finalAvatarUrl = avatar; 

      if (selectedFile) {
        setUploading(true);
        try {
          finalAvatarUrl = await dbSimulator.uploadProfileImage(selectedFile);
        } catch (uploadErr: unknown) {
          const msg = uploadErr instanceof Error ? uploadErr.message : "Upload gagal.";
          setErrorMessage("Gagal upload foto profil: " + msg);
          setLoading(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      const updatedUser: User = {
        ...user,
        fullName: fullName.trim(),
        email: email.trim(),
        avatar: finalAvatarUrl,
      };

      await dbSimulator.saveUser(updatedUser);
      setSessionUser(updatedUser);
      setUser(updatedUser);
      setAvatar(finalAvatarUrl);

      resetProfileImageState();

      // Dispatch event to update navbar/header immediately without refresh
      window.dispatchEvent(new Event("profile_updated"));

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
      link.download = `PlazaOleos_Backup_${new Date().toISOString().slice(0, 10)}.json`;
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
    if (restoreFileInputRef.current) {
      restoreFileInputRef.current.click();
    }
  };

  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm("PERINGATAN!\n\nProses ini akan MENGHAPUS SELURUH DATA LAMA dan menimpanya dengan data dari file backup. Apakah Anda yakin?")) {
      try {
        setLoading(true);
        const textData = await file.text();
        await dbSimulator.restoreBackup(textData);
        alert("Restore Database Berhasil!\n\nHalaman akan dimuat ulang.");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Gagal merestore database. Pastikan file backup valid.");
      } finally {
        setLoading(false);
      }
    }
    
    if (restoreFileInputRef.current) {
      restoreFileInputRef.current.value = "";
    }
  };

  const displayAvatar = previewUrl || avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  return (
    <DashboardLayout roleRequired="admin">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white rounded-xl p-4 shadow-xl flex items-center gap-3 animate-slide-up text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/60 pb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Pengaturan Sistem</h1>
            <p className="text-slate-500 text-sm mt-0.5">Kelola profil, preferensi, dan konfigurasi database.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Profile & Password) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Profil Admin Settings */}
            <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/40 pb-4 mb-5">
                <UserIcon className="w-4 h-4 text-indigo-500" /> Profil Administrator
              </h2>
              
              <form onSubmit={handleSaveProfile} className="space-y-5">
                
                {/* ── UPLOAD FOTO PROFIL UI ────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-2">
                  <div className="relative group">
                    <img 
                      src={displayAvatar} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 bg-slate-800"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                         onClick={() => profileFileInputRef.current?.click()}>
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="file" 
                      ref={profileFileInputRef} 
                      onChange={handleProfileFileChange} 
                      accept="image/jpeg,image/jpg,image/png,image/webp" 
                      className="hidden" 
                    />
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => profileFileInputRef.current?.click()}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 font-bold py-1.5 px-3 rounded-lg text-[11px] transition-all flex items-center gap-1.5"
                      >
                        <ImagePlus className="w-3.5 h-3.5" /> Ganti Foto Profil
                      </button>
                      {selectedFile && (
                        <button type="button" onClick={resetProfileImageState} className="text-slate-400 hover:text-rose-400 transition-colors p-1" title="Batal">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {selectedFile && (
                      <div className="text-[10px] text-indigo-500 font-semibold max-w-[200px] truncate">File: {selectedFile.name}</div>
                    )}
                    <p className="text-[10px] text-slate-500 font-medium">Format JPG, PNG, atau WEBP. Maks 5MB.</p>
                  </div>
                </div>
                {/* ────────────────────────────────────────────────────────────── */}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Alamat Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={loading || uploading} className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-slate-900/10 dark:shadow-indigo-600/20 disabled:opacity-60">
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Mengupload...</>
                    ) : (
                      <><Save className="w-3.5 h-3.5" /> Simpan Profil</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Settings */}
            <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/40 pb-4 mb-5">
                <Lock className="w-4 h-4 text-indigo-500" /> Keamanan & Password
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Password Saat Ini</label>
                  <input 
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Password Baru</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Password baru"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Ulangi Password Baru</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={loading} className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all border border-transparent dark:border-slate-700 disabled:opacity-50">
                    Perbarui Password
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column (Preferences & Database) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* App Preferences */}
            <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/40 pb-4 mb-5">
                <Palette className="w-4 h-4 text-indigo-500" /> Preferensi Tampilan
              </h2>
              <form onSubmit={handleSavePreferences} className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" /></div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Bahasa</span>
                  </div>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="id">Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" /></div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Tema Warna</span>
                  </div>
                  <select 
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="light">Mode Terang (Light)</option>
                    <option value="dark">Mode Gelap (Dark)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" /></div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Notif Stok Menipis</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={lowStockAlerts} onChange={() => setLowStockAlerts(!lowStockAlerts)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-bold py-2.5 rounded-xl text-xs transition-all border border-transparent dark:border-slate-700">
                    Simpan Preferensi
                  </button>
                </div>
              </form>
            </div>

            {/* Cloud Database Management */}
            <div className="bg-indigo-600 dark:bg-indigo-500 border border-indigo-500 rounded-2xl p-6 shadow-sm text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Cloud className="w-32 h-32" />
              </div>
              
              <div className="relative z-10">
                <h2 className="text-sm font-extrabold flex items-center gap-2 border-b border-indigo-400/30 pb-4 mb-4">
                  <Cloud className="w-4 h-4 text-indigo-100" /> Manajemen Database
                </h2>
                <p className="text-xs text-indigo-100 mb-5 leading-relaxed">
                  Cadangkan seluruh data ke komputer Anda sebagai file JSON, atau restore data dari cadangan yang sudah ada.
                </p>

                <input type="file" accept=".json" className="hidden" ref={restoreFileInputRef} onChange={handleRestoreFileChange} />

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleCloudBackup}
                    disabled={loading}
                    className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10"
                  >
                    <DownloadCloud className="w-4 h-4" /> Download Backup (JSON)
                  </button>
                  <button 
                    onClick={handleCloudRestore}
                    disabled={loading}
                    className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-indigo-500"
                  >
                    <UploadCloud className="w-4 h-4" /> Restore dari File
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
