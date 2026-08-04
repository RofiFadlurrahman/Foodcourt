"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChefHat, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Loader2, Wallet } from "lucide-react";
import { dbSimulator } from "@/services/dbSimulator";
import ThemeToggle from "@/components/ThemeToggle";
import { setSessionUser, clearAllSession, clearSessionTenant } from "@/lib/session";

export default function AdminLoginPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Paksa hancurkan sesi lama di client & server untuk mencegah bug mismatch
    dbSimulator.logout().catch(() => {});
    clearAllSession();
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const sessionObj = await dbSimulator.login(username.trim(), password.trim());
      if (sessionObj) {
        if (sessionObj.user.role !== "admin") {
          setError("Akun ini bukan akun Pengelola.");
          setLoading(false); return;
        }
        setSuccess("Login berhasil. Mengarahkan ke dashboard...");
        setSessionUser(sessionObj.user);
        clearSessionTenant();
        setTimeout(() => router.push("/admin"), 700);
      } else {
        setError("Username atau password salah.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Beranda
          </Link>
          <ThemeToggle className="p-2 rounded-md border border-border hover:bg-muted transition-colors" iconClassName="w-4 h-4" />
        </div>

        <div className="border border-border rounded-lg bg-card p-7 shadow-sm">
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <h2 className="font-display text-2xl font-extrabold text-foreground">Pintu Pengelola</h2>
            <p className="text-xs text-muted-foreground mt-1">Masuk untuk kontrol semua stan di foodcourt.</p>
          </div>

          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive/30 rounded-md p-3 flex items-start gap-2.5 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-success/10 border border-success/30 rounded-md p-3 flex items-start gap-2.5 text-xs text-success">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Username Pengelola</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full bg-muted border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full bg-muted border border-border rounded-md pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold py-2.5 rounded-md uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...</>) : (<>Buka Dashboard <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <div className="mt-5 text-center border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">Belum punya akun pengelola? </span>
            <Link href="/admin/register" className="text-xs font-extrabold text-primary hover:underline">Daftar di sini</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
