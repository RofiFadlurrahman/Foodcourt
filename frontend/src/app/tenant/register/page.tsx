"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Lock, User as UserIcon, Mail, Phone, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { dbSimulator } from "@/services/dbSimulator";
import ThemeToggle from "@/components/ThemeToggle";

export default function TenantRegisterPage() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [hp, setHp] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!ownerName.trim() || !tenantName.trim() || !hp.trim() || !email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Harap isi semua kolom pendaftaran.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal harus 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      // Check if username already exists
      const users = await dbSimulator.getUsers();
      const existingUser = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (existingUser) {
        setError("Username sudah digunakan. Silakan pilih username lain.");
        setLoading(false);
        return;
      }

      // 1. Create Tenant User
      const savedUser = await dbSimulator.saveUser({
        id: "",
        username: username.trim().toLowerCase(),
        password: password,
        role: "tenant",
        fullName: ownerName.trim(),
        email: email.trim().toLowerCase(),
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      });

      // 2. Create Tenant Profile linked to user
      await dbSimulator.saveTenant({
        id: "",
        user_id: savedUser.id,
        nama_tenant: tenantName.trim(),
        nama_pemilik: ownerName.trim(),
        hp: hp.trim(),
        email: email.trim().toLowerCase(),
        status: "active",
        foto: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
      });

      setSuccess("Pendaftaran Tenant berhasil! Mengalihkan ke halaman masuk...");

      setTimeout(() => {
        router.push("/tenant/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem. Coba beberapa saat lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/tenant/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Kembali ke Masuk Tenant
          </Link>
          <ThemeToggle className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all dark:border-slate-800 dark:hover:bg-slate-800/50" iconClassName="w-4 h-4" />
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border border-slate-200/70 bg-white/80 shadow-2xl backdrop-blur-xl relative overflow-hidden dark:border-white/10 dark:bg-slate-900/70">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-cyan-500/25 mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Daftar Tenant Baru</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daftarkan outlet kuliner Anda ke sistem CloudFood</p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-5 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-300 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Owner Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Pemilik</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Nama pemilik outlet"
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all dark:bg-slate-950/60 dark:border-white/5 dark:text-slate-100"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Tenant Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Tenant / Outlet</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Contoh: Kopi Kenangan"
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all dark:bg-slate-950/60 dark:border-white/5 dark:text-slate-100"
                  disabled={loading}
                />
              </div>
            </div>

            {/* HP */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nomor HP</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all dark:bg-slate-950/60 dark:border-white/5 dark:text-slate-100"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="outlet@example.com"
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all dark:bg-slate-950/60 dark:border-white/5 dark:text-slate-100"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username untuk masuk"
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all dark:bg-slate-950/60 dark:border-white/5 dark:text-slate-100"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all dark:bg-slate-950/60 dark:border-white/5 dark:text-slate-100"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Konfirmasi Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password Anda"
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all dark:bg-slate-950/60 dark:border-white/5 dark:text-slate-100"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Mendaftar...
                </>
              ) : (
                <>
                  Daftar Sekarang <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
