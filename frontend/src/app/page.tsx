"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, Receipt, ChevronDown, Quote, MapPin, Clock, Star,
  ChefHat, Wallet, Wifi, HelpCircle,
} from "lucide-react";
import { initDB } from "@/services/dbSimulator";
import ThemeToggle from "@/components/ThemeToggle";

// Daftar stan fiktif biar kerasa kayak food court beneran
const STALLS = [
  { code: "A-01", name: "Bakso Pak Dar", signature: "Bakso Urat Pedas", price: "Rp 22.000", tag: "Terlaris", tagTone: "primary" },
  { code: "A-02", name: "Soto Ayam Bu Yatmi", signature: "Soto Kampung + Nasi", price: "Rp 18.000", tag: "Hangat", tagTone: "secondary" },
  { code: "A-03", name: "Nasi Goreng Pak Karto", signature: "Nasi Goreng Mawut", price: "Rp 20.000", tag: "Recomendasi", tagTone: "accent" },
  { code: "B-01", name: "Es Teh Manis Pojok", signature: "Es Teh Manis / Tawar", price: "Rp 5.000", tag: "Murah", tagTone: "secondary" },
  { code: "B-02", name: "Es Pisang Ijo Uni Rita", signature: "Pisang Ijo + Es Sirup", price: "Rp 12.000", tag: "Segar", tagTone: "accent" },
  { code: "B-03", name: "Kopi Senja", signature: "Kopi Susu Panas/Dingin", price: "Rp 15.000", tag: "Baru", tagTone: "primary" },
  { code: "C-01", name: "Geprek Bensu", signature: "Ayam Geprek Sambal Matah", price: "Rp 25.000", tag: "Pedes Nampol", tagTone: "primary" },
  { code: "C-02", name: "Warteg Bahari", signature: "Nasi + Lauk Komplit", price: "Rp 28.000", tag: "Lengkap", tagTone: "secondary" },
];

const TODAY_MENU = [
  { item: "Nasi Goreng Spesial", price: "Rp 23.000" },
  { item: "Bakso Komplit", price: "Rp 25.000" },
  { item: "Soto Ayam Kampung", price: "Rp 18.000" },
  { item: "Es Teh Manis", price: "Rp 5.000" },
  { item: "Kopi Susu", price: "Rp 15.000" },
  { item: "Pisang Goreng Keju", price: "Rp 10.000" },
  { item: "Ayam Geprek Sambal Matah", price: "Rp 25.000" },
  { item: "Nasi Uduk Komplit", price: "Rp 20.000" },
];

const ORDER_FLOW = [
  { n: 1, title: "Pelanggan Datang", body: "Beli di salah satu stan. Bayar langsung di kasir stan — bukan di meja pusat.", icon: MapPin },
  { n: 2, title: "Kasir Mencatat", body: "Makanan dipilih, kasir tekan menu di POS, langsung keluar struk thermal.", icon: Receipt },
  { n: 3, title: "Data Naik ke Cloud", body: "Begitu bayar, transaksi otomatis tersimpan ke laporan pusat. Pengelola langsung lihat.", icon: Wifi },
  { n: 4, title: "Stok & Laporan Rapi", body: "Stok berkurang otomatis, omzet masuk rekap. Tutup buku nggak perlu ngitung kertas.", icon: Wallet },
];

const FAQS = [
  {
    q: "Kalau listrik PLN mati, kasir stan masih bisa jualan?",
    a: "Bisa. POS jalan di laptop/HP. Kalau internet putus pun, transaksi disimpan lokal dulu dan akan naik otomatis ke cloud begitu online lagi. Jadi stan tetap bisa jualan.",
  },
  {
    q: "Apa tenant bisa lihat penjualan stan lain?",
    a: "Tidak. Tiap stan cuma bisa lihat menu dan transaksi stan dia sendiri. Yang bisa lihat semua stan sekaligus cuma admin pengelola gedung.",
  },
  {
    q: "Laporannya bisa di-export buat pembukuan?",
    a: "Bisa. Rekap harian, mingguan, atau bulanan bisa di-download jadi Excel/CSV. Tinggal bawa ke buku catatan atau software akuntansi.",
  },
  {
    q: "Biaya langganannya berapa?",
    a: "Gratis untuk skripsi & demo. Kalau nanti mau dipakai foodcourt beneran, tinggal kontak kami — sistemnya ringan, bisa self-host di VPS murah.",
  },
  {
    q: "Stan baru mau gabung, ribet daftarnya?",
    a: "Daftar lewat halaman Tenant, isi nama stan & menu, langsung aktif. Nggak perlu install apa-apa di sisi stan.",
  },
];

const TESTIMONIALS = [
  {
    name: "Pak Dar — Stan Bakso A-01",
    body: "Dulu pakai buku tulis, sore-sore pusing ngitung. Sekarang tinggal klik, sore langsung tau hasilnya. Laporan bulanan juga rapi, tinggal print buat setor ke pengelola.",
  },
  {
    name: "Bu Yatmi — Stan Soto A-02",
    body: "Anak saya yang ngerjain POS-nya. Awalnya takut ribet, ternyata tinggal pilih menu di layar, bayar, beres. Struk thermalnya juga otomatis keluar.",
  },
  {
    name: "Mas Ali — Pengelola Plaza Oleos Lantai 2",
    body: "Dulu tiap akhir bulan keliling stan ngecek struk. Sekarang buka laptop, ketemu semua. Yang telat bayar iuran juga langsung keliatan dari omzetnya.",
  },
];

function tagClass(tone: string) {
  const base = "stamp-solid";
  if (tone === "primary") return `${base} bg-primary text-primary-foreground`;
  if (tone === "accent") return `${base} bg-accent text-accent-foreground`;
  return `${base} bg-secondary text-secondary-foreground`;
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    initDB();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* TOP STRIP — papan pengumuman foodcourt */}
      <div className="bg-primary text-primary-foreground text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>Plaza Oleos — Lantai 2, Food Court. Buka 10.00–22.00 WIB</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 24 stan aktif</span>
            <span className="opacity-70">|</span>
            <span>Hari ini: 1.247 pesanan</span>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <ChefHat className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg leading-none block text-foreground">Plaza Oleos</span>
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground">Food Court</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm">
            <a href="#stan" className="menu-link text-foreground/80 hover:text-foreground transition-colors">Stan Tenant</a>
            <a href="#alur" className="menu-link text-foreground/80 hover:text-foreground transition-colors">Alur Order</a>
            <a href="#menu" className="menu-link text-foreground/80 hover:text-foreground transition-colors">Menu Hari Ini</a>
            <a href="#faq" className="menu-link text-foreground/80 hover:text-foreground transition-colors">Tanya Jawab</a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className="p-2 rounded-md border border-border hover:bg-muted transition-colors" iconClassName="w-4 h-4" />
            <Link href="/admin/login" className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider px-3 py-2 text-foreground/80 hover:text-foreground transition-colors">
              Masuk Admin
            </Link>
            <Link href="/tenant/login" className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-md transition-colors">
              Masuk Tenant <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 pt-12 md:pt-20 pb-16 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-10 items-start">

          {/* Hero copy */}
          <div className="lg:col-span-3">
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 border border-dashed border-primary/50 rounded text-primary text-[11px] font-bold uppercase tracking-widest">
              <Star className="w-3 h-3" /> Sistem Kasir & Laporan Foodcourt
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5 text-foreground">
              Buku tulis, kalkulator, sama nota kertas = <span className="text-primary">bye.</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-8">
              Sistem kasir digital Plaza Oleos Food Court. Bantu tiap stan catat pesanan, cetak struk, dan setor omzet ke pengelola tanpa ribet. Tinggal klik, beres.
            </p>

            {/* 2 portal cards — bukan glassmorphism, ini signage */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <div className="border border-border rounded-lg p-5 bg-card hover:border-primary transition-colors">
                <div className="text-[10px] font-extrabold tracking-[0.2em] text-primary uppercase mb-1">Pintu Pengelola</div>
                <h3 className="font-display text-lg font-bold text-foreground mb-1">Masuk sebagai Admin</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Lihat rekap semua stan, omzet harian, menu terlaris, dan tenant yang aktif.</p>
                <div className="flex gap-2">
                  <Link href="/admin/login" className="flex-1 text-center bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 rounded-md text-xs uppercase tracking-wider transition-colors">Masuk</Link>
                  <Link href="/admin/register" className="flex-1 text-center border border-border hover:bg-muted text-foreground font-bold py-2 rounded-md text-xs uppercase tracking-wider transition-colors">Daftar</Link>
                </div>
              </div>

              <div className="border border-border rounded-lg p-5 bg-card hover:border-secondary transition-colors">
                <div className="text-[10px] font-extrabold tracking-[0.2em] text-secondary uppercase mb-1">Pintu Stan</div>
                <h3 className="font-display text-lg font-bold text-foreground mb-1">Masuk sebagai Tenant</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Buka POS stan, input pesanan, cetak struk. Lihat omzet stan kamu sendiri.</p>
                <div className="flex gap-2">
                  <Link href="/tenant/login" className="flex-1 text-center bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-2 rounded-md text-xs uppercase tracking-wider transition-colors">Masuk</Link>
                  <Link href="/tenant/register" className="flex-1 text-center border border-border hover:bg-muted text-foreground font-bold py-2 rounded-md text-xs uppercase tracking-wider transition-colors">Daftar</Link>
                </div>
              </div>
            </div>

            {/* Quick proof — bukan fake stats, ini hal konkret */}
            <div className="grid grid-cols-3 gap-4 max-w-xl">
              <div>
                <div className="font-display text-2xl md:text-3xl font-extrabold text-foreground">± 8 detik</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">waktu input 1 pesanan</div>
              </div>
              <div>
                <div className="font-display text-2xl md:text-3xl font-extrabold text-foreground">24 stan</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">bisa dipegang bareng</div>
              </div>
              <div>
                <div className="font-display text-2xl md:text-3xl font-extrabold text-foreground">0 kertas</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">buku tulis manual</div>
              </div>
            </div>
          </div>

          {/* Hero visual — struk belanja */}
          <div className="lg:col-span-2 relative">
            <div className="receipt rounded-md p-5 mx-auto max-w-sm">
              <div className="text-center border-b border-dashed border-current/30 pb-3 mb-3">
                <div className="font-display text-base font-extrabold uppercase tracking-wider">Stan Bakso Pak Dar</div>
                <div className="text-[10px] opacity-70">Plaza Oleos — Lantai 2, Kode A-01</div>
                <div className="text-[10px] opacity-70 mt-1">No. Order: CF-20260801-047</div>
                <div className="text-[10px] opacity-70">01/08/2026 12:34 WIB</div>
              </div>

              <div className="space-y-1.5 text-[11px] mb-3">
                <div className="flex justify-between"><span>1x Bakso Urat</span><span>22.000</span></div>
                <div className="flex justify-between"><span>2x Es Teh Manis</span><span>10.000</span></div>
                <div className="flex justify-between"><span>1x Kerupuk</span><span>3.000</span></div>
              </div>

              <div className="border-t border-dashed border-current/30 pt-2 mb-3 text-[11px] space-y-0.5">
                <div className="flex justify-between"><span>Subtotal</span><span>35.000</span></div>
                <div className="flex justify-between text-[10px] opacity-70"><span>Pajak (PB1 10%)</span><span>3.500</span></div>
              </div>

              <div className="border-t border-double border-current/50 pt-2 flex justify-between font-extrabold text-sm">
                <span>TOTAL</span><span>Rp 38.500</span>
              </div>

              <div className="text-center text-[10px] opacity-70 mt-3 border-t border-dashed border-current/30 pt-2">
                Bayar: QRIS — Lunas<br />
                <span className="opacity-60">~ struk digital tersimpan otomatis ~</span>
              </div>
            </div>

            <div className="hidden md:block absolute -bottom-4 -right-2 stamp text-foreground border-foreground hover-wiggle">
              Hari ini terinput
            </div>
          </div>
        </div>
      </section>

      {/* STAN TENANT — directory */}
      <section id="stan" className="px-6 py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="divider-kuliner mb-3"><span>Stan Tenant Aktif</span></div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-2 text-foreground">Papan Petunjuk Stan</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Contoh stan yang terdaftar di Plaza Oleos Food Court. Stan kamu bisa nongol di sini juga.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STALLS.map((stall) => (
              <div key={stall.code} className="stall-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-extrabold tracking-[0.2em] text-muted-foreground uppercase">KODE {stall.code}</span>
                  <span className={tagClass(stall.tagTone)}>{stall.tag}</span>
                </div>
                <h3 className="font-display text-base font-extrabold text-foreground leading-tight mb-1">{stall.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{stall.signature}</p>
                <div className="price-tag">{stall.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALUR ORDER */}
      <section id="alur" className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="divider-kuliner mb-3"><span>Alur Pemesanan</span></div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-2 text-foreground">Dari Stan ke Laporan, Nggak Pake Ribet</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ORDER_FLOW.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.n} className="border border-border rounded-lg p-5 bg-card relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground font-display font-extrabold flex items-center justify-center text-sm shadow-sm">
                  {step.n}
                </div>
                <Icon className="w-6 h-6 text-primary mb-3" strokeWidth={2} />
                <h3 className="font-display font-extrabold text-base mb-1.5 text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* MENU HARI INI — chalkboard */}
      <section id="menu" className="px-6 py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-2">
            <div className="divider-kuliner mb-3 justify-start"><span>Menu Hari Ini</span></div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-3 text-foreground">Papan Menu, Tapi Online</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Tenant bisa update menu & harga langsung dari POS. Pengunjung foodcourt bisa lihat-lihat dulu sebelum antre di stan.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground">Bonus:</span> kalau stok habis, menu otomatis disembunyikan. Pengelola dapet notifikasi kalau ada stan yang hampir tutup.
            </p>
          </div>

          <div className="lg:col-span-3">
            <div className="chalkboard p-6 max-w-xl mx-auto">
              <div className="text-center mb-4">
                <div className="font-display text-2xl font-extrabold uppercase tracking-widest" style={{ textShadow: "0 0 1px rgba(254, 243, 199, 0.5)" }}>
                  Menu Hari Ini
                </div>
                <div className="text-[10px] opacity-60 tracking-widest uppercase">Sabtu, 01 Agustus 2026</div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {TODAY_MENU.map((m) => (
                  <div key={m.item} className="flex items-baseline gap-2 text-sm">
                    <span className="flex-1 font-semibold">{m.item}</span>
                    <span className="opacity-50">———</span>
                    <span className="font-mono font-bold tabular-nums">{m.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-3 border-t border-dashed border-current/30 text-center text-[10px] opacity-60 uppercase tracking-widest">
                ~ Tutup jam 22.00 WIB ~
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — bukan fake stats, real warung voice */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="divider-kuliner mb-3"><span>Katanya Mereka</span></div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">Pengalaman Stan & Pengelola</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="border border-border rounded-lg p-5 bg-card">
              <Quote className="w-5 h-5 text-primary mb-2" />
              <blockquote className="text-sm text-foreground/90 leading-relaxed mb-4">{t.body}</blockquote>
              <figcaption className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground border-t border-border pt-3">
                {t.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-16 bg-card border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <HelpCircle className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="font-display text-3xl font-extrabold mb-2 text-foreground">Tanya Jawab</h2>
            <p className="text-muted-foreground text-sm">Yang sering ditanyain pas demo.</p>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-border rounded-md overflow-hidden bg-background">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-10 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-extrabold text-sm text-foreground">Plaza Oleos</div>
              <div className="text-[10px] text-muted-foreground tracking-wider uppercase">Food Court · Lantai 2</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} CloudFood — Sistem kasir untuk Plaza Oleos Food Court.</div>
          <div className="flex gap-4 text-xs font-bold text-muted-foreground">
            <a href="#stan" className="hover:text-primary transition-colors">Stan</a>
            <a href="#alur" className="hover:text-primary transition-colors">Alur</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
