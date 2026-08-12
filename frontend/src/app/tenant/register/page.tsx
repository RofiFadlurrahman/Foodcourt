"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store, Lock, User as UserIcon, Mail, Phone,
  Eye, EyeOff, AlertCircle, CheckCircle,
  ArrowLeft, ArrowRight, Loader2, KeyRound, ShieldCheck
} from "lucide-react";
import { dbSimulator } from "@/services/dbSimulator";
import ThemeToggle from "@/components/ThemeToggle";
import { clearAllSession } from "@/lib/session";

export default function TenantRegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Pastikan tidak ada sisa session dari login sebelumnya
    dbSimulator.logout().catch(() => {});
    clearAllSession();
  }, []);

  const [ownerName, setOwnerName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [hp, setHp] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [codeAdminName, setCodeAdminName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Validasi kode undangan saat user meninggalkan field (on blur) ──────────
  const handleCodeBlur = async () => {
    const code = invitationCode.trim().toUpperCase();
    if (!code) {
      setCodeValid(null);
      setCodeAdminName("");
      return;
    }
    setValidatingCode(true);
    setCodeValid(null);
    setCodeAdminName("");
    try {
      // Pakai endpoint PUBLIC — tidak butuh session
      const result = await dbSimulator.validateInvitation(code);
      if (result.valid && result.admin_name) {
        setCodeValid(true);
        setCodeAdminName(result.admin_name);
      } else {
        setCodeValid(false);
        setCodeAdminName("");
      }
    } catch {
      setCodeValid(false);
    } finally {
      setValidatingCode(false);
    }
  };

  // ── Submit registration ────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validasi frontend
    if (!invitationCode.trim()) {
      setError("Kode undangan wajib diisi. Minta kode kepada admin Food Court Anda.");
      return;
    }
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
      // ── Panggil endpoint PUBLIC register-tenant.php ─────────────────────
      // Endpoint ini TIDAK memerlukan session/login apapun.
      // admin_id ditentukan di backend berdasarkan invitation_code.
      const result = await dbSimulator.registerTenantWithInvitation({
        invitation_code:      invitationCode.trim().toUpperCase(),
        owner_name:           ownerName.trim(),
        tenant_name:          tenantName.trim(),
        phone:                hp.trim(),
        email:                email.trim().toLowerCase(),
        username:             username.trim().toLowerCase(),
        password:             password,
        password_confirmation: confirmPassword,
      });

      if (!result.success) {
        setError(result.message || "Terjadi kesalahan saat mendaftar.");
        setLoading(false);
        return;
      }

      setSuccess(
        `Pendaftaran berhasil! Akun Anda dikelola oleh ${result.data?.admin_name ?? "admin"}. Mengalihkan ke halaman masuk...`
      );

      setTimeout(() => {
        router.push("/tenant/login");
      }, 1800);

    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      setError(msg || "Terjadi kesalahan sistem. Coba beberapa saat lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/tenant/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Masuk Tenant
          </Link>
          <ThemeToggle
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all dark:border-slate-800 dark:hover:bg-slate-800/50"
            iconClassName="w-4 h-4"
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border border-slate-200/70 bg-white/80 shadow-2xl backdrop-blur-xl relative overflow-hidden dark:border-white/10 dark:bg-slate-900/70">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-cyan-500/25 mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Daftar Tenant Baru
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Daftarkan outlet kuliner Anda ke Plaza Oleos Food Court
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-300">
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

          <form onSubmit={handleRegister} className="space-y-3.5">

            {/* ── KODE UNDANGAN ─────────────────────────────────────────── */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Kode Undangan <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => {
                    setInvitationCode(e.target.value.toUpperCase());
                    setCodeValid(null);
                    setCodeAdminName("");
                  }}
                  onBlur={handleCodeBlur}
                  placeholder="Contoh: ABC12345"
                  className={`w-full bg-slate-100/80 border rounded-xl pl-10 pr-10 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 transition-all dark:bg-slate-950/60 dark:text-slate-100 uppercase tracking-widest font-bold ${
                    codeValid === true
                      ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : codeValid === false
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 text-slate-900"
                      : "border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 text-slate-900 dark:border-white/5"
                  }`}
                  disabled={loading}
                  maxLength={20}
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {validatingCode && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  {!validatingCode && codeValid === true && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  {!validatingCode && codeValid === false && <AlertCircle className="w-4 h-4 text-rose-400" />}
                </div>
              </div>
              {codeValid === true && codeAdminName && (
                <p className="text-[10px] text-emerald-500 font-semibold pl-1">
                  ✓ Kode valid — dikelola oleh: {codeAdminName}
                </p>
              )}
              {codeValid === false && (
                <p className="text-[10px] text-rose-400 font-semibold pl-1">
                  ✗ Kode tidak valid, sudah digunakan, atau kedaluwarsa
                </p>
              )}
              <p className="text-[10px] text-slate-400 pl-1">
                Minta kode undangan kepada pengelola Food Court Anda.
              </p>
            </div>

            <div className="border-t border-slate-200 dark:border-white/5 pt-1" />

            {/* Nama Pemilik */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Nama Pemilik
              </label>
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

            {/* Nama Tenant */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Nama Tenant / Outlet
              </label>
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
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Nomor HP
              </label>
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
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Email
              </label>
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
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Username
              </label>
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
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Password
              </label>
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
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Konfirmasi Password
              </label>
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

            {/* Submit */}
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
