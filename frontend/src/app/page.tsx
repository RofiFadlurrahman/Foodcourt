"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Cloud, Database, TrendingUp, Users, Menu as MenuIcon, Activity, CheckCircle, Shield, Zap, Play, DollarSign, PieChart, Store, HelpCircle, ChevronDown, Award } from "lucide-react";
import { initDB } from "@/services/dbSimulator";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"admin" | "tenant">("admin");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    initDB();
  }, []);

  // Demo login removed as per request

  const faqs = [
    {
      q: "Bagaimana teknologi Cloud Computing diimplementasikan dalam sistem ini?",
      a: "Sistem menggunakan arsitektur cloud-ready di mana semua data transaksi, profil tenant, dan inventori menu disimpan secara terpusat pada cloud database (Supabase/Firestore). Hal ini memungkinkan sinkronisasi real-time antar perangkat kasir tenant dan dashboard analitik pengelola foodcourt.",
    },
    {
      q: "Apakah tenant hanya dapat melihat data penjualan mereka sendiri?",
      a: "Ya. Keamanan data sangat kami prioritaskan. Sistem memiliki mekanisme otorisasi multi-tenant yang membatasi hak akses secara ketat, sehingga akun tenant hanya dapat melihat dan mengelola menu serta transaksi outlet mereka sendiri, sementara administrator memiliki akses agregat global.",
    },
    {
      q: "Apakah laporan transaksi dapat diekspor untuk keperluan pembukuan?",
      a: "Tentu saja. Baik admin maupun tenant dapat mengunduh laporan penjualan periodik (harian, mingguan, bulanan) dalam format PDF terstruktur, lembar kerja Excel (CSV), maupun mencetak struk fisik penjualan secara langsung dari browser.",
    },
    {
      q: "Apakah sistem ini mendukung operasional offline jika internet terganggu?",
      a: "Sistem didesain dengan strategi caching LocalStorage. Jika koneksi cloud terputus sementara, transaksi kasir tetap dapat diinput dan disimpan secara lokal untuk kemudian disinkronisasikan kembali secara otomatis setelah koneksi cloud pulih.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
      {/* BACKGROUND GLOW DECORATIONS (Stripe/Linear Style) */}
      <div className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-600/15" />
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[75%] rounded-full bg-cyan-500/10 blur-[120px] dark:bg-cyan-600/12" />
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 dark:border-slate-800/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Cloud className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-cyan-400">CloudFood</span>
            <span className="text-[9px] block font-semibold text-slate-400 tracking-widest uppercase">System</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-gray-300">
          <a href="#fitur" className="hover:text-indigo-500 dark:hover:text-white transition-colors">
            Fitur
          </a>
          <a href="#preview" className="hover:text-indigo-500 dark:hover:text-white transition-colors">
            Preview
          </a>
          <a href="#keunggulan" className="hover:text-indigo-500 dark:hover:text-white transition-colors">
            Teknologi Cloud
          </a>
          <a href="#faq" className="hover:text-indigo-500 dark:hover:text-white transition-colors">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all dark:border-slate-800 dark:hover:bg-slate-800/50" iconClassName="w-4 h-4" />

          <Link href="/admin/login" className="hidden sm:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-white transition-colors">
            Masuk Admin
          </Link>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <Link href="/tenant/login" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
            Masuk Tenant <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-20 pb-16 px-6 max-w-7xl mx-auto text-center md:pt-32 md:pb-24">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:bg-[rgba(99,102,241,0.15)] dark:text-[#C4B5FD] dark:border-indigo-500/30 mb-8 animate-fade-in">
          <Award className="w-3.5 h-3.5" />
          <span>Efisien, Akurat, dan Mudah Digunakan</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6 text-slate-900 dark:text-white">
          Sistem Informasi Berbasis Cloud yang{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-cyan-400">Efisien, Akurat, dan Mudah Digunakan</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Platform cloud untuk mengelola transaksi, memantau penjualan secara real-time, dan menganalisis performa tenant dengan cara yang efisien dan akurat.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-20 text-left">
          {/* Admin Access Card */}
          <div className="bg-white/50 border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md dark:bg-slate-900/40 dark:border-slate-800/60 hover:border-indigo-500/40 transition-all">
            <div className="mb-4">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">PORTAL PENGELOLA</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Administrator Foodcourt</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelola data tenant, daftar menu global, laporan, & analisis penjualan.</p>
            </div>
            <div className="flex w-full gap-2 mt-2">
              <Link href="/admin/login" className="flex-1 text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-1">
                Masuk
              </Link>
              <Link href="/admin/register" className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center">
                Daftar
              </Link>
            </div>
          </div>

          {/* Tenant Access Card */}
          <div className="bg-white/50 border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md dark:bg-slate-900/40 dark:border-slate-800/60 hover:border-cyan-500/40 transition-all">
            <div className="mb-4">
              <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest block mb-1">PORTAL OUTLET</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tenant & Kasir POS</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelola menu outlet Anda, layani transaksi kasir, & pantau hasil penjualan secara mandiri.</p>
            </div>
            <div className="flex w-full gap-2 mt-2">
              <Link href="/tenant/login" className="flex-1 text-center bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-1">
                Masuk
              </Link>
              <Link href="/tenant/register" className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center">
                Daftar
              </Link>
            </div>
          </div>
        </div>

        {/* HERO DASHBOARD PREVIEW */}
        <div id="preview" className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden glass shadow-2xl border border-slate-200/50 dark:border-slate-800/50 p-3 glow-primary">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200/60 dark:border-slate-800/40">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>

            {/* Dashboard Tabs Preview */}
            <div className="flex bg-slate-200/80 dark:bg-slate-800/60 rounded-lg p-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-3 py-1.5 rounded-md transition-all ${activeTab === "admin" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800"}`}
              >
                Dashboard Admin
              </button>
              <button
                onClick={() => setActiveTab("tenant")}
                className={`px-3 py-1.5 rounded-md transition-all ${activeTab === "tenant" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800"}`}
              >
                Dashboard Tenant (POS)
              </button>
            </div>

            <div className="w-16" />
          </div>

          {/* Interactive Mockup Layout */}
          <div className="dark bg-[#090d16] text-slate-300 min-h-[350px] p-6 text-left font-mono text-xs overflow-hidden relative">
            {activeTab === "admin" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <span className="text-white font-bold">Laporan Real-Time Cloud Agregat</span>
                  </div>
                  <span className="text-cyan-400">Database: Supabase Firestore (Simulated)</span>
                </div>

                {/* 4 Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-[#0f1526] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 block">Total Pendapatan</span>
                    <span className="text-base text-white font-bold">Rp 127.840.000</span>
                    <span className="text-[9px] text-emerald-400 block mt-1">▲ +12.4% vs Minggu Lalu</span>
                  </div>
                  <div className="bg-[#0f1526] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 block">Transaksi Hari Ini</span>
                    <span className="text-base text-white font-bold">78 Order</span>
                    <span className="text-[9px] text-emerald-400 block mt-1">▲ +8.2% dari Kemarin</span>
                  </div>
                  <div className="bg-[#0f1526] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 block">Tenant Aktif</span>
                    <span className="text-base text-white font-bold">3 Outlet</span>
                    <span className="text-[9px] text-slate-400 block mt-1">Uptime 99.99%</span>
                  </div>
                  <div className="bg-[#0f1526] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 block">Backup Terakhir</span>
                    <span className="text-base text-cyan-400 font-bold">Baru saja</span>
                    <span className="text-[9px] text-slate-400 block mt-1">Auto-sync Cloud On</span>
                  </div>
                </div>

                {/* Graph mockup */}
                <div className="bg-[#0f1526] border border-slate-800 rounded-xl p-4 h-[180px] flex flex-col justify-between">
                  <span className="text-[10px] text-white font-bold">Line Chart: Tren Pendapatan 7 Hari Terakhir</span>
                  {/* Mock Recharts bars/lines */}
                  <div className="flex items-end justify-between h-[100px] px-4 pb-2 border-b border-slate-800">
                    <div className="w-8 bg-indigo-500/20 border-t border-indigo-400 h-[40%] rounded-t-sm flex items-center justify-center text-[8px] text-indigo-300">Sen</div>
                    <div className="w-8 bg-indigo-500/25 border-t border-indigo-400 h-[50%] rounded-t-sm flex items-center justify-center text-[8px] text-indigo-300">Sel</div>
                    <div className="w-8 bg-indigo-500/30 border-t border-indigo-400 h-[45%] rounded-t-sm flex items-center justify-center text-[8px] text-indigo-300">Rab</div>
                    <div className="w-8 bg-indigo-500/35 border-t border-indigo-400 h-[65%] rounded-t-sm flex items-center justify-center text-[8px] text-indigo-300">Kam</div>
                    <div className="w-8 bg-indigo-500/40 border-t border-indigo-400 h-[60%] rounded-t-sm flex items-center justify-center text-[8px] text-indigo-300">Jum</div>
                    <div className="w-8 bg-indigo-500/70 border-t-2 border-indigo-400 h-[85%] rounded-t-sm flex items-center justify-center text-[8px] text-indigo-200 font-bold">Sab</div>
                    <div className="w-8 bg-cyan-500/80 border-t-2 border-cyan-400 h-[95%] rounded-t-sm flex items-center justify-center text-[8px] text-cyan-200 font-bold">Min</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-white font-bold">Point of Sales (POS) Kasir Tenant: Bakso Wonogiri Eko</span>
                  </div>
                  <span className="text-slate-500">Outlet ID: t-1</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* POS Column left - Items selection */}
                  <div className="col-span-2 space-y-2">
                    <span className="text-[10px] text-slate-500 block">Daftar Menu Hidangan (Klik untuk menambah)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0f1526] border border-slate-800 rounded-lg p-2 hover:border-indigo-500 cursor-pointer transition-colors">
                        <span className="text-white block font-bold">Bakso Urat Spesial</span>
                        <span className="text-cyan-400 block">Rp 25.000</span>
                        <span className="text-[8px] text-slate-500">Stok: 48 porsi</span>
                      </div>
                      <div className="bg-[#0f1526] border border-slate-800 rounded-lg p-2 hover:border-indigo-500 cursor-pointer transition-colors">
                        <span className="text-white block font-bold">Mie Ayam Pangsit</span>
                        <span className="text-cyan-400 block">Rp 22.000</span>
                        <span className="text-[8px] text-slate-500">Stok: 39 porsi</span>
                      </div>
                    </div>
                  </div>

                  {/* POS Column right - Cart summary */}
                  <div className="bg-[#0f1526] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-white font-bold block border-b border-slate-800 pb-1.5 mb-1.5">Keranjang Belanja</span>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span>1x Bakso Urat</span>
                          <span>Rp 25.000</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>1x Mie Ayam</span>
                          <span>Rp 22.000</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-1.5 mt-1.5 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span>Total</span>
                        <span className="text-cyan-400">Rp 47.000</span>
                      </div>
                      <button className="w-full bg-indigo-600 text-white font-bold py-1.5 rounded text-[10px] hover:bg-indigo-500">Cetak Struk & Bayar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Absolute overlay indicator */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent pointer-events-none" />
            <Link
              href="/admin/login"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 text-slate-400 font-semibold text-[10px] hover:text-white transition-colors cursor-pointer animate-pulse-subtle"
            >
              Akses Portal untuk Mencoba Sistem Secara Penuh
            </Link>
          </div>
        </div>
      </section>

      {/* STATS COUNT */}
      <section className="bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800/50 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">15+</div>
            <div className="text-xs md:text-sm text-slate-500 font-medium">Tenant Aktif Terdaftar</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">Rp 120M+</div>
            <div className="text-xs md:text-sm text-slate-500 font-medium">Transaksi Terproses / bln</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">99.9%</div>
            <div className="text-xs md:text-sm text-slate-500 font-medium">Uptime Server Cloud</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">&lt; 1 Detik</div>
            <div className="text-xs md:text-sm text-slate-500 font-medium">Sinkronisasi Real-Time</div>
          </div>
        </div>
      </section>

      {/* FITUR UNGGULAN */}
      <section id="fitur" className="py-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">Fitur Utama Sistem Informasi Foodcourt</h2>
          <p className="text-slate-600 dark:text-gray-300 text-sm sm:text-base">Segala kemudahan operasional penjualan digital dan analitik performa foodcourt dikemas dalam satu platform modular.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass rounded-2xl p-6 hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Dashboard Analitik Real-Time</h3>
            <p className="text-slate-500 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Monitor pendapatan total harian, bulanan, grafik menu terlaris, dan performa omzet antar tenant secara grafis dan real-time.</p>
          </div>

          {/* Card 2 */}
          <div className="glass rounded-2xl p-6 hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Point of Sales (POS) Kasir Tenant</h3>
            <p className="text-slate-500 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Kasir khusus untuk tenant untuk memasukkan menu pesanan pelanggan secara instan, mencetak struk belanja, dan menghitung total harga.</p>
          </div>

          {/* Card 3 */}
          <div className="glass rounded-2xl p-6 hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Cloud className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Sinkronisasi Cloud Computing</h3>
            <p className="text-slate-500 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Integrasi database terpusat yang aman, tangguh, dan dapat diakses dari mana saja. Mendukung cloud backup & restore database sekali klik.</p>
          </div>

          {/* Card 4 */}
          <div className="glass rounded-2xl p-6 hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Multi-User & Hak Akses Ketat</h3>
            <p className="text-slate-500 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Pemisahan hak akses yang ketat antara Administrator (pengelola gedung) dan Tenant (pemilik kedai) untuk menjamin kerahasiaan omzet data.</p>
          </div>

          {/* Card 5 */}
          <div className="glass rounded-2xl p-6 hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Manajemen Menu & Inventori</h3>
            <p className="text-slate-500 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Kelola stok makanan/minuman, kategori hidangan, update harga, status ketersediaan menu secara otomatis saat transaksi diproses.</p>
          </div>

          {/* Card 6 */}
          <div className="glass rounded-2xl p-6 hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Ekspor Laporan PDF & Excel</h3>
            <p className="text-slate-500 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">Hasilkan laporan harian, mingguan, bulanan, tahunan, per tenant, maupun per menu ke file Excel (CSV) dan PDF terformat rapi.</p>
          </div>
        </div>
      </section>

      {/* CARA KERJA SISTEM */}
      <section className="bg-slate-100 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800/40 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">Cara Kerja Alur Penjualan Foodcourt</h2>
            <p className="text-slate-600 dark:text-gray-300 text-sm">Sistem mempermudah pencatatan transaksi dari meja kasir tenant hingga pelaporan terkonsolidasi.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg">1</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Pemesanan Makanan</h3>
              <p className="text-xs text-slate-500 dark:text-gray-300">Pelanggan memesan makanan di salah satu outlet tenant foodcourt.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg">2</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Input Kasir Tenant</h3>
              <p className="text-xs text-slate-500 dark:text-gray-300">Kasir memasukkan menu ke Point of Sales (POS), cetak struk virtual, dan terima bayaran.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg">3</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Sync Real-Time Cloud</h3>
              <p className="text-xs text-slate-500 dark:text-gray-300">Transaksi otomatis disinkronkan ke cloud database pusat pengelola foodcourt secara instan.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg">4</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Monitor & Analisis</h3>
              <p className="text-xs text-slate-500 dark:text-gray-300">Pengelola melihat grafik omzet per menit, komparasi antar tenant, dan laporan komprehensif.</p>
            </div>
          </div>
        </div>
      </section>

      {/* KEUNGGULAN CLOUD COMPUTING */}
      <section id="keunggulan" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block mb-2">Keunggulan Teknologi</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">Mengapa Cloud Computing Penting untuk Foodcourt Modern?</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 mt-1">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Aksesibilitas Multi-Device</h3>
                  <p className="text-slate-500 dark:text-gray-300 text-xs sm:text-sm mt-1">Pemilik foodcourt dapat memantau operasional dan pendapatan melalui smartphone mereka saat di luar kota tanpa perlu ke lokasi fisik.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 mt-1">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Keamanan Data Terjamin & Backup Otomatis</h3>
                  <p className="text-slate-500 dark:text-gray-300 text-xs sm:text-sm mt-1">Kehilangan data karena kerusakan komputer lokal dapat dihindari. Seluruh riwayat transaksi dicadangkan secara berkala ke database cloud.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 mt-1">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Skalabilitas Outlet Tanpa Batas</h3>
                  <p className="text-slate-500 dark:text-gray-300 text-xs sm:text-sm mt-1">Menambah tenant baru di area foodcourt menjadi sangat mudah. Akun baru langsung terintegrasi ke platform dalam hitungan detik.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden glass p-4 aspect-square max-w-md mx-auto flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50">
            <div className="absolute w-[200px] h-[200px] rounded-full bg-cyan-500/10 blur-[80px]" />
            <div className="z-10 text-center space-y-4">
              <Cloud className="w-24 h-24 text-indigo-500 dark:text-indigo-400 mx-auto animate-bounce" />
              <div className="font-extrabold text-xl text-white">Database Terpusat</div>
              <div className="text-slate-400 dark:text-gray-300 text-xs px-8">Data penjualan tersinkronisasi instan ke Firebase / Supabase Storage. Menjamin integritas data pembukuan skripsi Anda.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="bg-slate-100 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800/40 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <HelpCircle className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">Pertanyaan yang Sering Diajukan (FAQ)</h2>
            <p className="text-slate-500 dark:text-gray-300 text-sm">Temukan jawaban atas pertanyaan umum seputar teknis sistem informasi penjualan foodcourt ini.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="glass rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800/40 transition-all">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/20 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                </button>

                {openFaq === index && <div className="p-5 pt-0 border-t border-slate-200/50 dark:border-slate-800/20 text-slate-500 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800/50 py-12 px-6 bg-white dark:bg-[#04060d]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white">
              <Cloud className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-cyan-400">CloudFood</span>
          </div>

          <div className="text-xs text-slate-500 dark:text-gray-300">© {new Date().getFullYear()} CloudFood. Dibuat sebagai solusi website premium proyek skripsi sistem informasi foodcourt.</div>

          <div className="flex gap-4 text-xs font-semibold text-slate-500 dark:text-gray-300">
            <a href="#fitur" className="hover:text-indigo-500 dark:hover:text-white transition-colors">
              Fitur
            </a>
            <a href="#preview" className="hover:text-indigo-500 dark:hover:text-white transition-colors">
              Demo
            </a>
            <a href="#faq" className="hover:text-indigo-500 dark:hover:text-white transition-colors">
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
