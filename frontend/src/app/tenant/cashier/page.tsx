"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Menu, Tenant, Transaction } from "@/services/dbSimulator";
import { getSessionTenant } from "@/lib/session";
import {
  ShoppingCart, Search, Plus, Minus, Trash2, CreditCard,
  DollarSign, CheckCircle2, QrCode, X, Printer, Loader2, Wallet, Lock, Shield
} from "lucide-react";

interface CartItem {
  menu: Menu;
  qty: number;
}

interface MockSnapDetails {
  orderId: string;
  total: number;
  items: {
    name: string;
    qty: number;
    price: number;
  }[];
}

interface ReceiptTx {
  id: string;
  date: string;
  items: {
    name: string;
    qty: number;
    harga: number;
    total: number;
  }[];
  total: number;
  paymentMethod: string;
  cashPaid: number;
  change: number;
}

interface WindowWithSnap extends Window {
  snap?: {
    pay: (token: string, callbacks: {
      onSuccess: (result: unknown) => void;
      onPending: (result: unknown) => void;
      onError: (result: unknown) => void;
      onClose: () => void;
    }) => void;
  };
}

export default function TenantCashier() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Debit' | 'Midtrans'>("QRIS");
  const [cashAmount, setCashAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  // Midtrans Mock/Simulated Snap States
  const [isMockSnapOpen, setIsMockSnapOpen] = useState(false);
  const [mockSnapToken, setMockSnapToken] = useState("");
  const [mockSnapDetails, setMockSnapDetails] = useState<MockSnapDetails | null>(null);
  const [mockSnapPaymentType, setMockSnapPaymentType] = useState<"qris" | "va" | "cc">("qris");
  const [mockProcessing, setMockProcessing] = useState(false);

  // Virtual Receipt Modal
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<ReceiptTx | null>(null);
  const [changeAmount, setChangeAmount] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const sessionTenant = getSessionTenant<Tenant>();
      if (!sessionTenant) return;
      setActiveTenant(sessionTenant);

      const menuList = await dbSimulator.getMenus();
      const tenantMenus = menuList.filter(m => m.tenant_id === sessionTenant.id);
      setMenus(tenantMenus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchData);

    // Dynamically inject Midtrans Snap Sandbox script
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-YOUR_DUMMY_KEY";
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const addToCart = (menu: Menu) => {
    if (menu.stok <= 0 || menu.status === "empty") return;

    setCart(prevCart => {
      const idx = prevCart.findIndex(item => item.menu.id === menu.id);
      if (idx >= 0) {
        // Check stock limit
        if (prevCart[idx].qty >= menu.stok) {
          alert(`Stok hanya tersisa ${menu.stok} porsi.`);
          return prevCart;
        }
        const newCart = [...prevCart];
        newCart[idx].qty += 1;
        return newCart;
      } else {
        return [...prevCart, { menu, qty: 1 }];
      }
    });
  };

  const updateQty = (menuId: string, delta: number) => {
    setCart(prevCart => {
      const idx = prevCart.findIndex(item => item.menu.id === menuId);
      if (idx < 0) return prevCart;

      const newCart = [...prevCart];
      const newQty = newCart[idx].qty + delta;
      
      // Stock limit check on increase
      if (delta > 0 && newQty > newCart[idx].menu.stok) {
        alert(`Stok hanya tersisa ${newCart[idx].menu.stok} porsi.`);
        return prevCart;
      }

      if (newQty <= 0) {
        return prevCart.filter(item => item.menu.id !== menuId);
      } else {
        newCart[idx].qty = newQty;
        return newCart;
      }
    });
  };

  const removeFromCart = (menuId: string) => {
    setCart(prevCart => prevCart.filter(item => item.menu.id !== menuId));
  };

  const getSubtotal = () => {
    return cart.reduce((acc, item) => acc + (item.menu.harga * item.qty), 0);
  };

  const saveTransactionToLocal = async (method: 'Cash' | 'QRIS' | 'Debit' | 'Midtrans', paidAmount: number, changeAmt: number) => {
    const total = getSubtotal();
    const createdTxs: Transaction[] = [];
    for (const item of cart) {
      const txObj = await dbSimulator.addTransaction({
        tenant_id: activeTenant?.id || "",
        menu_id: item.menu.id,
        jumlah: item.qty,
        total_harga: item.menu.harga * item.qty,
        metode_pembayaran: method
      });
      createdTxs.push(txObj);
    }

    setReceiptTx({
      id: createdTxs[0]?.id || `tx-${Date.now()}`,
      date: new Date().toISOString(),
      items: cart.map(item => ({
        name: item.menu.nama_menu,
        qty: item.qty,
        harga: item.menu.harga,
        total: item.menu.harga * item.qty
      })),
      total,
      paymentMethod: method,
      cashPaid: paidAmount,
      change: changeAmt
    });

    setCart([]);
    setCashAmount("");
    setIsReceiptOpen(true);
    fetchData();
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const total = getSubtotal();

    if (paymentMethod === "Midtrans") {
      setProcessing(true);
      try {
        const orderId = `order-${Date.now()}`;
        const res = await fetch("/api/midtrans/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            orderId,
            grossAmount: total,
            items: cart.map(item => ({
              id: item.menu.id,
              price: item.menu.harga,
              quantity: item.qty,
              name: item.menu.nama_menu
            }))
          })
        });

        const data = await res.json();

        if (data.isMock) {
          setMockSnapToken(data.token);
          setMockSnapDetails({
            orderId,
            total,
            items: cart.map(item => ({
              name: item.menu.nama_menu,
              qty: item.qty,
              price: item.menu.harga
            }))
          });
          setIsMockSnapOpen(true);
        } else {
          const win = window as WindowWithSnap;
          if (win.snap) {
            win.snap.pay(data.token, {
              onSuccess: async function (result: unknown) {
                await saveTransactionToLocal("Midtrans", total, 0);
              },
              onPending: function (result: unknown) {
                alert("Pembayaran pending. Selesaikan proses pembayaran Anda.");
              },
              onError: function (result: unknown) {
                alert("Pembayaran gagal!");
              },
              onClose: function () {
                alert("Pembayaran dibatalkan.");
              }
            });
          } else {
            // fallback if snap script failed to load
            setMockSnapToken(data.token);
            setMockSnapDetails({
              orderId,
              total,
              items: cart.map(item => ({
                name: item.menu.nama_menu,
                qty: item.qty,
                price: item.menu.harga
              }))
            });
            setIsMockSnapOpen(true);
          }
        }
      } catch (err) {
        console.error("Midtrans Snap Error:", err);
        // graceful offline fallback
        setMockSnapToken(`mock-snap-token-${Date.now()}`);
        setMockSnapDetails({
          orderId: `order-${Date.now()}`,
          total,
          items: cart.map(item => ({
            name: item.menu.nama_menu,
            qty: item.qty,
            price: item.menu.harga
          }))
        });
        setIsMockSnapOpen(true);
      } finally {
        setProcessing(false);
      }
      return;
    }

    let change = 0;

    if (paymentMethod === "Cash") {
      const cash = Number(cashAmount);
      if (isNaN(cash) || cash < total) {
        alert("Nominal uang tunai yang diterima kurang atau tidak valid.");
        return;
      }
      change = cash - total;
      setChangeAmount(change);
    }

    setProcessing(true);

    try {
      await saveTransactionToLocal(paymentMethod, paymentMethod === "Cash" ? Number(cashAmount) : total, change);
    } catch (err) {
      console.error(err);
      alert("Gagal memproses transaksi kasir.");
    } finally {
      setProcessing(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  };

  // Filter logic
  const filteredMenus = menus.filter(m => {
    const matchesSearch = m.nama_menu.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || m.kategori === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout roleRequired="tenant">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">Mesin Kasir (POS)</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Catat pesanan pelanggan, cetak struk, simpan ke laporan.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid lg:grid-cols-3 gap-5 animate-pulse">
            <div className="lg:col-span-2 h-[450px] bg-muted border border-border rounded-md" />
            <div className="h-[450px] bg-muted border border-border rounded-md" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* LEFT PANEL - MENU SELECTION CATALOG */}
            <div className="lg:col-span-2 space-y-4">

              {/* Search & Category Filter */}
              <div className="bg-card border border-border rounded-md p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-muted border border-transparent rounded-md pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                <div className="flex bg-muted p-1 rounded-md text-xs font-bold self-start sm:self-auto">
                  {["all", "Makanan", "Minuman", "Cemilan"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded transition-colors ${
                        categoryFilter === cat
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat === "all" ? "Semua" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menus Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredMenus.map((menu) => {
                  const isOutOfStock = menu.stok <= 0 || menu.status === "empty";
                  return (
                    <div
                      key={menu.id}
                      onClick={() => !isOutOfStock && addToCart(menu)}
                      className={`bg-card border rounded-md overflow-hidden p-3 cursor-pointer transition-colors flex flex-col justify-between ${
                        isOutOfStock
                          ? "opacity-50 border-border cursor-not-allowed"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      <div className="relative h-24 sm:h-28 rounded overflow-hidden mb-2 bg-muted">
                        <img
                          src={menu.foto}
                          alt={menu.nama_menu}
                          className="w-full h-full object-cover"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-foreground/70 flex items-center justify-center text-[10px] font-extrabold text-background uppercase tracking-widest">
                            Habis
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 text-xs">
                        <h4 className="font-extrabold text-foreground truncate">{menu.nama_menu}</h4>
                        <div className="flex justify-between items-center text-[10px] border-t border-border pt-1">
                          <span className="font-extrabold text-primary">{formatRupiah(menu.harga)}</span>
                          <span className="text-muted-foreground">Stok: {menu.stok}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* RIGHT PANEL - SHOPPING CART & PAYMENT CHECKOUT */}
            <div className="bg-card border border-border rounded-md p-5 h-[580px] flex flex-col justify-between">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 font-display font-extrabold text-sm sm:text-base text-foreground">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <span>Daftar Belanja</span>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-extrabold">
                  {cart.length} Item
                </span>
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <ShoppingCart className="w-8 h-8 opacity-30" />
                    <span>Belum ada pesanan. Tap menu di samping.</span>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.menu.id}
                      className="flex items-center justify-between gap-3 border-b border-border pb-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-foreground block truncate">{item.menu.nama_menu}</span>
                        <span className="text-[10px] text-muted-foreground">{formatRupiah(item.menu.harga)} × {item.qty}</span>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQty(item.menu.id, -1)}
                          className="p-1 rounded bg-muted hover:bg-muted/70 text-foreground"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-extrabold w-4 text-center text-foreground">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.menu.id, 1)}
                          className="p-1 rounded bg-muted hover:bg-muted/70 text-foreground"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.menu.id)}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="border-t border-border pt-4 space-y-4">

                {/* 1. Payment Methods Selection */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Metode Pembayaran</span>
                  <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                    {(["QRIS", "Debit", "Cash", "Midtrans"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 rounded border font-extrabold flex flex-col items-center justify-center gap-1 transition-colors ${
                          paymentMethod === method
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-muted border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                      >
                        {method === "QRIS" ? (
                          <QrCode className="w-3.5 h-3.5" />
                        ) : method === "Debit" ? (
                          <CreditCard className="w-3.5 h-3.5" />
                        ) : method === "Cash" ? (
                          <DollarSign className="w-3.5 h-3.5" />
                        ) : (
                          <Wallet className="w-3.5 h-3.5" />
                        )}
                        <span>{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Cash input */}
                {paymentMethod === "Cash" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-muted-foreground uppercase">Uang Tunai Diterima *</label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="contoh: 50000"
                      className="w-full bg-muted border border-transparent rounded-md p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-colors font-mono"
                      required
                    />
                  </div>
                )}

                {/* 3. Totals display */}
                <div className="space-y-1.5 border-t border-border pt-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatRupiah(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-foreground">
                    <span>Total Bayar</span>
                    <span className="text-primary">{formatRupiah(getSubtotal())}</span>
                  </div>
                </div>

                {/* 4. Submit button */}
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold py-3 rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider text-xs"
                  disabled={cart.length === 0 || processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses Transaksi...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Cetak Struk & Bayar
                    </>
                  )}
                </button>

              </form>

            </div>

          </div>
        )}

        {/* 4. VIRTUAL RECEIPT MODAL */}
        {isReceiptOpen && receiptTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-foreground/50" onClick={() => setIsReceiptOpen(false)} />

            <div className="relative w-full max-w-sm receipt rounded-md p-6 z-10 font-mono text-xs">

              {/* Modal Close Button */}
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="absolute top-3 right-3 opacity-60 hover:opacity-100 p-1 border border-current/30 rounded"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Receipt Header */}
              <div className="text-center space-y-1 mb-4 border-b border-dashed border-current/30 pb-3">
                <h3 className="font-extrabold text-sm uppercase">{activeTenant?.nama_tenant}</h3>
                <p className="text-[10px] opacity-70">Foodcourt Cloud Center</p>
                <p className="text-[9px] opacity-60">Telp: {activeTenant?.hp}</p>
              </div>

              {/* Meta */}
              <div className="space-y-1 mb-4 text-[10px] border-b border-current/20 pb-2">
                <div className="flex justify-between">
                  <span>No. Order:</span>
                  <span className="font-bold">{receiptTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>
                    {new Date(receiptTx.date).toLocaleDateString("id-ID", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{activeTenant?.nama_pemilik}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-4 border-b border-dashed border-current/30 pb-3">
                {receiptTx.items.map((item) => (
                  <div key={item.name} className="space-y-0.5">
                    <div className="flex justify-between font-semibold">
                      <span>{item.name}</span>
                      <span>{formatRupiah(item.total)}</span>
                    </div>
                    <div className="text-[10px] opacity-70">
                      {item.qty} x {formatRupiah(item.harga)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculation Totals */}
              <div className="space-y-1.5 mb-5 text-right">
                <div className="flex justify-between font-extrabold text-sm">
                  <span>TOTAL</span>
                  <span>{formatRupiah(receiptTx.total)}</span>
                </div>
                <div className="flex justify-between opacity-70 text-[10px]">
                  <span>Metode Pembayaran:</span>
                  <span>{receiptTx.paymentMethod}</span>
                </div>
                <div className="flex justify-between opacity-70 text-[10px]">
                  <span>Bayar:</span>
                  <span>{formatRupiah(receiptTx.cashPaid)}</span>
                </div>
                {receiptTx.paymentMethod === "Cash" && (
                  <div className="flex justify-between font-extrabold border-t border-current/30 pt-1">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(receiptTx.change)}</span>
                  </div>
                )}
              </div>

              {/* Receipt Footer */}
              <div className="text-center text-[10px] opacity-70 space-y-3">
                <p>Terima kasih atas kunjungan Anda!</p>
                <div className="border-t border-current/20 pt-3 flex justify-center gap-2">
                  <button
                    onClick={() => { window.print(); }}
                    className="bg-foreground text-background font-bold py-1.5 px-3 rounded flex items-center gap-1 text-[9px] transition-colors"
                  >
                    <Printer className="w-3 h-3" /> Cetak Fisik
                  </button>
                  <button
                    onClick={() => setIsReceiptOpen(false)}
                    className="border border-current/30 font-bold py-1.5 px-3 rounded text-[9px] transition-colors hover:bg-foreground/10"
                  >
                    Tutup Struk
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MIDTRANS MOCK SNAP MODAL */}
        {isMockSnapOpen && mockSnapDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-foreground/50" onClick={() => setIsMockSnapOpen(false)} />

            <div className="relative w-full max-w-sm bg-card text-foreground rounded-md shadow-2xl z-10 border border-border flex flex-col overflow-hidden">
              {/* Snap Modal Header */}
              <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-extrabold text-sm tracking-tight">Midtrans Snap <span className="text-[9px] bg-foreground/30 px-1.5 py-0.5 rounded font-mono">SANDBOX</span></span>
                </div>
                <button
                  onClick={() => setIsMockSnapOpen(false)}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order Info & Amount */}
              <div className="bg-muted border-b border-border p-4 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-extrabold">Merchant</p>
                  <p className="font-extrabold text-foreground">{activeTenant?.nama_tenant}</p>
                  <p className="text-[9px] text-primary font-mono mt-0.5">{mockSnapDetails.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-extrabold">Total Bayar</p>
                  <p className="font-extrabold text-primary text-sm">{formatRupiah(mockSnapDetails.total)}</p>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="p-4 flex-1 space-y-4">
                <div className="flex bg-muted p-1 rounded-md text-[10px] font-extrabold">
                  <button
                    type="button"
                    onClick={() => setMockSnapPaymentType("qris")}
                    className={`flex-1 py-1.5 rounded transition-colors flex items-center justify-center gap-1 ${mockSnapPaymentType === "qris" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <QrCode className="w-3.5 h-3.5" /> Gopay / QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockSnapPaymentType("va")}
                    className={`flex-1 py-1.5 rounded transition-colors flex items-center justify-center gap-1 ${mockSnapPaymentType === "va" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Virtual Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockSnapPaymentType("cc")}
                    className={`flex-1 py-1.5 rounded transition-colors flex items-center justify-center gap-1 ${mockSnapPaymentType === "cc" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Lock className="w-3.5 h-3.5" /> Kartu Kredit
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="bg-card border border-border rounded p-4 min-h-[160px] flex flex-col justify-center items-center text-xs">
                  {mockSnapPaymentType === "qris" && (
                    <div className="text-center space-y-3 flex flex-col items-center w-full">
                      <div className="w-28 h-28 border-4 border-foreground rounded-md p-2 bg-card flex flex-col justify-between items-center relative">
                        <div className="grid grid-cols-4 gap-1.5 w-full h-full opacity-90">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div
                              key={i}
                              className={`rounded-sm ${(i % 3 === 0 || i % 4 === 1 || i === 0 || i === 3 || i === 12 || i === 15) ? "bg-foreground" : "bg-transparent"}`}
                            />
                          ))}
                        </div>
                        <div className="absolute inset-0 m-auto w-7 h-7 bg-primary rounded-sm border-2 border-card flex items-center justify-center text-[8px] font-extrabold text-primary-foreground uppercase">
                          Gpy
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium text-center">Pindai QR pakai GoPay, OVO, DANA, ShopeePay, atau BCA Mobile.</p>
                    </div>
                  )}

                  {mockSnapPaymentType === "va" && (
                    <div className="w-full space-y-3 text-left">
                      <div className="border-b border-border pb-2 flex justify-between items-center">
                        <span className="font-extrabold text-foreground">Bank Transfer BCA</span>
                        <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-extrabold">Dicek Otomatis</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground font-extrabold uppercase">Nomor Virtual Account</p>
                        <div className="flex justify-between items-center bg-muted p-2 rounded border border-border">
                          <span className="font-mono font-extrabold text-primary tracking-wider">390108123456789</span>
                          <button
                            type="button"
                            onClick={() => alert("Nomor VA disalin!")}
                            className="text-[10px] text-muted-foreground hover:text-primary font-extrabold font-sans"
                          >
                            Salin
                          </button>
                        </div>
                      </div>
                      <ol className="list-decimal list-inside text-[9px] text-muted-foreground space-y-0.5">
                        <li>Pilih Transfer &gt; BCA Virtual Account.</li>
                        <li>Masukkan nomor VA di atas.</li>
                        <li>Konfirmasi nominal dan selesaikan pembayaran.</li>
                      </ol>
                    </div>
                  )}

                  {mockSnapPaymentType === "cc" && (
                    <div className="w-full space-y-2 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-muted-foreground uppercase">Nomor Kartu Kredit</label>
                        <input
                          type="text"
                          placeholder="4111 1111 1111 1111"
                          className="w-full bg-muted border border-border rounded p-2 text-xs font-mono tracking-wider focus:outline-none focus:border-primary"
                          disabled
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-muted-foreground uppercase">Valid Thru</label>
                          <input
                            type="text"
                            placeholder="12/28"
                            className="w-full bg-muted border border-border rounded p-2 text-xs focus:outline-none"
                            disabled
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-muted-foreground uppercase">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full bg-muted border border-border rounded p-2 text-xs focus:outline-none"
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="bg-muted px-4 py-3 border-t border-border flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMockSnapOpen(false)}
                  className="flex-1 border border-border hover:bg-card text-foreground font-extrabold py-2 rounded text-xs transition-colors"
                  disabled={mockProcessing}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setMockProcessing(true);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    setMockProcessing(false);
                    setIsMockSnapOpen(false);
                    await saveTransactionToLocal("Midtrans", mockSnapDetails?.total || 0, 0);
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold py-2 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                  disabled={mockProcessing}
                >
                  {mockProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Simulasi Bayar Sukses"
                  )}
                </button>
              </div>

              {/* Secure badge */}
              <div className="bg-muted py-1.5 text-center text-[8px] text-muted-foreground font-extrabold uppercase tracking-widest border-t border-border flex items-center justify-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Secured by Midtrans Encryption
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
