"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Tenant, User } from "@/services/dbSimulator";
import { getSessionTenant, getSessionUser, setSessionTenant, setSessionUser } from "@/lib/session";
import {
  User as UserIcon, Store, Phone, Mail, Save, CheckCircle, AlertCircle, Loader2, Upload, X, ImagePlus
} from "lucide-react";

export default function TenantProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Form States
  const [namaTenant, setNamaTenant] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");
  const [hp, setHp] = useState("");
  const [email, setEmail] = useState("");
  const [foto, setFoto] = useState("");

  // ── State Upload Foto ──────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Load session info
    const sessionUser = getSessionUser<User>();
    const sessionTenant = getSessionTenant<Tenant>();

    setTimeout(() => {
      if (sessionUser) setUser(sessionUser);
      if (sessionTenant) {
        setTenant(sessionTenant);
        setNamaTenant(sessionTenant.nama_tenant);
        setNamaPemilik(sessionTenant.nama_pemilik);
        setHp(sessionTenant.hp);
        setEmail(sessionTenant.email);
        setFoto(sessionTenant.foto);
      }
    }, 0);
  }, []);

  // Cleanup Object URL preview
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrorMessage("Format foto tidak diizinkan. Gunakan JPG, JPEG, PNG, atau WEBP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ukuran foto terlalu besar. Maksimal 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setErrorMessage("");

    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!tenant || !user) return;
    if (!namaTenant.trim() || !namaPemilik.trim() || !hp.trim() || !email.trim()) {
      setErrorMessage("Semua kolom bertanda bintang (*) wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      // ── Upload Foto Baru Jika Ada ───────────────────────────────────────────
      let finalFotoUrl = foto; 

      if (selectedFile) {
        setUploading(true);
        try {
          finalFotoUrl = await dbSimulator.uploadProfileImage(selectedFile);
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

      // 1. Update Tenant details
      const updatedTenant: Tenant = {
        ...tenant,
        nama_tenant: namaTenant.trim(),
        nama_pemilik: namaPemilik.trim(),
        hp: hp.trim(),
        email: email.trim(),
        foto: finalFotoUrl
      };
      await dbSimulator.saveTenant(updatedTenant);
      setSessionTenant(updatedTenant);
      setTenant(updatedTenant);
      setFoto(finalFotoUrl); // Update local state for display

      // 2. Update User details matching email & full name
      const updatedUser: User = {
        ...user,
        fullName: namaPemilik.trim(),
        email: email.trim(),
        avatar: finalFotoUrl // Sinkronisasi avatar user juga
      };
      await dbSimulator.saveUser(updatedUser);
      setSessionUser(updatedUser);
      setUser(updatedUser);

      resetImageState(); // Clear form state

      // 3. Dispatch event to update navbar/header immediately without refresh
      window.dispatchEvent(new Event("profile_updated"));

      showToast("Profil outlet kedai berhasil disimpan.");
    } catch (e) {
      console.error(e);
      setErrorMessage("Gagal memperbarui profil outlet.");
    } finally {
      setLoading(false);
    }
  };

  const displayImage = previewUrl || foto || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80";

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
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-sans">Ubah Profil Outlet Kedai</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Kelola identitas publik outlet, penanggung jawab, serta kontak komunikasi.</p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main profile form card */}
        <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm max-w-2xl text-xs sm:text-sm font-semibold">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Visual Cover/Photo Preview */}
            <div className="relative">
              <div className="relative h-44 rounded-xl overflow-hidden bg-slate-800">
                <img 
                  src={displayImage} 
                  alt={namaTenant}
                  className="w-full h-full object-cover brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded uppercase font-bold tracking-wider block w-max mb-1">Outlet Outlet</span>
                  <h3 className="font-extrabold text-base sm:text-lg">{namaTenant || "Kedai Anda"}</h3>
                </div>
              </div>

              {/* Upload Foto Tombol Tumpang Tindih */}
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/jpeg,image/jpg,image/png,image/webp" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Ganti Foto
                </button>
                {selectedFile && (
                  <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-white text-[10px] px-2 py-1.5 rounded-lg flex items-center gap-2 max-w-[200px]">
                    <span className="truncate">{selectedFile.name}</span>
                    <button type="button" onClick={resetImageState} className="text-slate-400 hover:text-white" title="Batal pilih foto">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Inputs grid */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Outlet Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" /> Nama Tenant Outlet *
                  </label>
                  <input 
                    type="text" 
                    value={namaTenant}
                    onChange={(e) => setNamaTenant(e.target.value)}
                    placeholder="e.g. Kedai Ramen Sari"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Owner Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" /> Nama Penanggung Jawab *
                  </label>
                  <input 
                    type="text" 
                    value={namaPemilik}
                    onChange={(e) => setNamaPemilik(e.target.value)}
                    placeholder="e.g. Budi Santoso"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Nomor Telepon / HP *
                  </label>
                  <input 
                    type="text" 
                    value={hp}
                    onChange={(e) => setHp(e.target.value)}
                    placeholder="e.g. 08123456789"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Alamat Email Outlet *
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. kedai@sari.com"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              
            </div>

            <div className="pt-6 mt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setNamaTenant(tenant?.nama_tenant || "");
                  setNamaPemilik(tenant?.nama_pemilik || "");
                  setHp(tenant?.hp || "");
                  setEmail(tenant?.email || "");
                  setFoto(tenant?.foto || "");
                  resetImageState();
                  setErrorMessage("");
                }}
                className="bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-bold py-2.5 px-5 rounded-xl transition-all"
                disabled={uploading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-60 disabled:pointer-events-none"
                disabled={loading || uploading}
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Mengupload...</>
                ) : (
                  <><Save className="w-4 h-4" /> Simpan Perubahan</>
                )}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
