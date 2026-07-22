"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { dbSimulator } from "@/services/dbSimulator";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !password.trim()) {
      setError("Harap isi username dan password Anda.");
      return;
    }

    setLoading(true);

    try {
      const sessionObj = await dbSimulator.login(username.trim(), password.trim());
      if (sessionObj) {
        if (sessionObj.user.role !== "admin") {
          setError("Akses ditolak. Akun Anda tidak terdaftar sebagai Administrator.");
          setLoading(false);
          return;
        }

        setSuccess("Login Administrator berhasil! Mengalihkan ke dashboard...");

        // Save session info to localStorage
        localStorage.setItem("session_user", JSON.stringify(sessionObj.user));
        localStorage.removeItem("session_tenant"); // Admin does not have a tenant association

        setTimeout(() => {
          router.push("/admin");
        }, 800);
      } else {
        setError("Username atau password salah. Silakan coba lagi.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem. Coba beberapa saat lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background blobs with deep Indigo theme for Admin */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Kembali ke Beranda
          </Link>
          <ThemeToggle className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all dark:border-slate-800 dark:hover:bg-slate-800/50" iconClassName="w-4 h-4" />
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border border-slate-200/70 bg-white/80 shadow-2xl backdrop-blur-xl relative overflow-hidden dark:border-white/10 dark:bg-slate-900/70">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/20 mb-4">
              <Shield className="w-6 h-6 animate-pulse-subtle" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Portal Masuk Admin</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gunakan kredensial pengelola untuk mengontrol sistem foodcourt</p>
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

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username Admin</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username admin"
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:bg-slate-950/60 dark:border-white/5 dark:text-slate-100"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:bg-slate-950/60 dark:border-white/5 dark:text-slate-100"
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

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk Sekarang <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 text-center border-t border-slate-150 dark:border-slate-800 pt-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">Belum punya akun admin? </span>
            <Link href="/admin/register" className="text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
              Daftar di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
