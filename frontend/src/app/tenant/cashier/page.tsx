"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dbSimulator, Menu, Tenant, Transaction } from "@/services/dbSimulator";
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, 
  DollarSign, CheckCircle2, QrCode, X, Printer, Loader2, Wallet, Lock, Shield
} from "lucide-react";

interface CartItem {
  menu: Menu;
  qty: number;
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
  const [mockSnapDetails, setMockSnapDetails] = useState<any>(null);
  const [mockSnapPaymentType, setMockSnapPaymentType] = useState<"qris" | "va" | "cc">("qris");
  const [mockProcessing, setMockProcessing] = useState(false);

  // Virtual Receipt Modal
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<any>(null);
  const [changeAmount, setChangeAmount] = useState(0);

  useEffect(() => {
    fetchData();

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const sessionTenantStr = localStorage.getItem("session_tenant");
      if (!sessionTenantStr) return;
      const tenantObj = JSON.parse(sessionTenantStr) as Tenant;
      setActiveTenant(tenantObj);

      const allMenus = await dbSimulator.getMenus();
      const tenantMenus = allMenus.filter(m => m.tenant_id === tenantObj.id);
      setMenus(tenantMenus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
          if ((window as any).snap) {
            (window as any).snap.pay(data.token, {
              onSuccess: async function (result: any) {
                await saveTransactionToLocal("Midtrans", total, 0);
              },
              onPending: function (result: any) {
                alert("Pembayaran pending. Selesaikan proses pembayaran Anda.");
              },
              onError: function (result: any) {
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
            <h1 className="text-2xl font-extrabold tracking-tight">Point of Sales (POS)</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Antarmuka kasir digital cepat untuk mencatat penjualan kedai kuliner.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
            <div className="lg:col-span-2 h-[450px] bg-slate-800 rounded-2xl" />
            <div className="h-[450px] bg-slate-800 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT PANEL - MENU SELECTION CATALOG */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Search & Category Filter */}
              <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari menu makanan/minuman..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 border border-transparent rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                  {["all", "Makanan", "Minuman", "Cemilan"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        categoryFilter === cat 
                          ? "bg-indigo-600 text-white shadow-sm" 
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {cat === "all" ? "Semua" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menus Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {filteredMenus.map((menu) => {
                  const isOutOfStock = menu.stok <= 0 || menu.status === "empty";
                  return (
                    <div
                      key={menu.id}
                      onClick={() => !isOutOfStock && addToCart(menu)}
                      className={`bg-white dark:bg-[#0d1222] border rounded-2xl overflow-hidden shadow-sm p-3 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between ${
                        isOutOfStock 
                          ? "opacity-50 border-slate-200 dark:border-slate-800 cursor-not-allowed" 
                          : "border-slate-200 dark:border-slate-800/40 hover:border-indigo-500/50"
                      }`}
                    >
                      <div className="relative h-24 sm:h-28 rounded-xl overflow-hidden mb-2 bg-slate-800">
                        <img 
                          src={menu.foto} 
                          alt={menu.nama_menu} 
                          className="w-full h-full object-cover"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">
                            Habis
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{menu.nama_menu}</h4>
                        <div className="flex justify-between items-center text-[10px] border-t border-slate-100 dark:border-slate-800/30 pt-1">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(menu.harga)}</span>
                          <span className="text-slate-400">Stok: {menu.stok}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* RIGHT PANEL - SHOPPING CART & PAYMENT CHECKOUT */}
            <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm h-[580px] flex flex-col justify-between">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  <ShoppingCart className="w-5 h-5 text-indigo-500" />
                  <span>Daftar Belanja</span>
                </div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                  {cart.length} Item
                </span>
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                    <ShoppingCart className="w-8 h-8 opacity-30" />
                    <span>Keranjang Anda kosong</span>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div 
                      key={item.menu.id} 
                      className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/20 pb-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">{item.menu.nama_menu}</span>
                        <span className="text-[10px] text-slate-400">{formatRupiah(item.menu.harga)} x {item.qty}</span>
                      </div>
                      
                      {/* Qty Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => updateQty(item.menu.id, -1)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold w-4 text-center">{item.qty}</span>
                        <button 
                          onClick={() => updateQty(item.menu.id, 1)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.menu.id)}
                          className="p-1 text-rose-400 hover:bg-rose-500/10 rounded ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="border-t border-slate-100 dark:border-slate-800/40 pt-4 space-y-4">
                
                {/* 1. Payment Methods Selection */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Metode Pembayaran</span>
                  <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                    {(["QRIS", "Debit", "Cash", "Midtrans"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 rounded-xl border font-bold flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] ${
                          paymentMethod === method
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                            : "bg-slate-100 border-transparent text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        {method === "QRIS" ? (
                          <QrCode className="w-3.5 h-3.5" />
                        ) : method === "Debit" ? (
                          <CreditCard className="w-3.5 h-3.5" />
                        ) : method === "Cash" ? (
                          <DollarSign className="w-3.5 h-3.5" />
                        ) : (
                          <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span className="font-semibold">{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Cash input */}
                {paymentMethod === "Cash" && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Uang Tunai Diterima *</label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-mono"
                      required
                    />
                  </div>
                )}

                {/* 3. Totals display */}
                <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/20 pt-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatRupiah(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                    <span>Total Pembayaran</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{formatRupiah(getSubtotal())}</span>
                  </div>
                </div>

                {/* 4. Submit button */}
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.01] active:scale-[0.99]"
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
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsReceiptOpen(false)} />
            
            <div className="relative w-full max-w-sm bg-white text-slate-900 rounded-2xl shadow-2xl p-6 z-10 animate-scale-up font-mono text-xs border border-slate-200">
              
              {/* Modal Close Button */}
              <button 
                onClick={() => setIsReceiptOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 border rounded"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Receipt Header */}
              <div className="text-center space-y-1 mb-4 border-b border-dashed border-slate-300 pb-3">
                <h3 className="font-extrabold text-sm uppercase">{activeTenant?.nama_tenant}</h3>
                <p className="text-[10px] text-slate-500">Foodcourt Cloud Center</p>
                <p className="text-[9px] text-slate-400">Telp: {activeTenant?.hp}</p>
              </div>

              {/* Meta */}
              <div className="space-y-1 mb-4 text-[10px] border-b border-slate-100 pb-2">
                <div className="flex justify-between">
                  <span>No. Order:</span>
                  <span className="font-bold">{receiptTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>
                    {new Date(receiptTx.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{activeTenant?.nama_pemilik}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-4 border-b border-dashed border-slate-300 pb-3">
                {receiptTx.items.map((item: any) => (
                  <div key={item.name} className="space-y-0.5">
                    <div className="flex justify-between font-semibold">
                      <span>{item.name}</span>
                      <span>{formatRupiah(item.total)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.qty} x {formatRupiah(item.harga)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculation Totals */}
              <div className="space-y-1.5 mb-6 text-right">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL</span>
                  <span>{formatRupiah(receiptTx.total)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Metode Pembayaran:</span>
                  <span>{receiptTx.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Bayar:</span>
                  <span>{formatRupiah(receiptTx.cashPaid)}</span>
                </div>
                {receiptTx.paymentMethod === "Cash" && (
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-100 pt-1">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(receiptTx.change)}</span>
                  </div>
                )}
              </div>

              {/* Receipt Footer */}
              <div className="text-center text-[10px] text-slate-500 space-y-3">
                <p>Terima kasih atas kunjungan Anda!</p>
                <div className="border-t border-slate-200 pt-3 flex justify-center gap-2">
                  <button 
                    onClick={() => { window.print(); }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded flex items-center gap-1 text-[9px] transition-all"
                  >
                    <Printer className="w-3 h-3" /> Cetak Fisik
                  </button>
                  <button 
                    onClick={() => setIsReceiptOpen(false)}
                    className="border border-slate-300 hover:bg-slate-100 font-bold py-1.5 px-3 rounded text-[9px] transition-all"
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
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsMockSnapOpen(false)} />
            
            <div className="relative w-full max-w-sm bg-[#fafafa] text-slate-800 rounded-2xl shadow-2xl z-10 animate-scale-up border border-slate-200/50 flex flex-col overflow-hidden">
              {/* Snap Modal Header */}
              <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-300" />
                  <span className="font-extrabold text-sm tracking-tight">Midtrans Snap <span className="text-[9px] bg-slate-900/40 text-cyan-200 px-1.5 py-0.5 rounded font-mono">SANDBOX</span></span>
                </div>
                <button 
                  onClick={() => setIsMockSnapOpen(false)}
                  className="text-slate-200 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order Info & Amount */}
              <div className="bg-white border-b border-slate-100 p-4 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Merchant</p>
                  <p className="font-bold text-slate-700">{activeTenant?.nama_tenant}</p>
                  <p className="text-[9px] text-indigo-500 font-mono mt-0.5">{mockSnapDetails.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Total Pembayaran</p>
                  <p className="font-extrabold text-indigo-600 text-sm">{formatRupiah(mockSnapDetails.total)}</p>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="p-4 flex-1 space-y-4">
                <div className="flex bg-slate-200/60 p-1 rounded-xl text-[10px] font-bold">
                  <button 
                    type="button"
                    onClick={() => setMockSnapPaymentType("qris")}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${mockSnapPaymentType === "qris" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    <QrCode className="w-3.5 h-3.5" /> Gopay / QRIS
                  </button>
                  <button 
                    type="button"
                    onClick={() => setMockSnapPaymentType("va")}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${mockSnapPaymentType === "va" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Virtual Account
                  </button>
                  <button 
                    type="button"
                    onClick={() => setMockSnapPaymentType("cc")}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${mockSnapPaymentType === "cc" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    <Lock className="w-3.5 h-3.5" /> Kartu Kredit
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 min-h-[160px] flex flex-col justify-center items-center text-xs">
                  {mockSnapPaymentType === "qris" && (
                    <div className="text-center space-y-3 flex flex-col items-center w-full">
                      {/* Simulated QR Code */}
                      <div className="w-28 h-28 border-4 border-slate-900 rounded-lg p-2 bg-white flex flex-col justify-between items-center relative shadow-sm">
                        <div className="grid grid-cols-4 gap-1.5 w-full h-full opacity-90">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`rounded-sm ${(i % 3 === 0 || i % 4 === 1 || i === 0 || i === 3 || i === 12 || i === 15) ? "bg-slate-900" : "bg-transparent"}`} 
                            />
                          ))}
                        </div>
                        {/* Middle GoPay logo container */}
                        <div className="absolute inset-0 m-auto w-7 h-7 bg-indigo-600 rounded-md border-2 border-white flex items-center justify-center text-[8px] font-bold text-white uppercase shadow-sm">
                          Gpy
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium text-center">Pindai kode QR di atas menggunakan GoPay, OVO, LinkAja, Dana, atau BCA Mobile.</p>
                    </div>
                  )}

                  {mockSnapPaymentType === "va" && (
                    <div className="w-full space-y-3 text-left">
                      <div className="border-b pb-2 flex justify-between items-center">
                        <span className="font-bold text-slate-700">Bank Transfer BCA</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">Dicek Otomatis</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Nomor Virtual Account</p>
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border">
                          <span className="font-mono font-bold text-indigo-600 tracking-wider">390108123456789</span>
                          <button 
                            type="button"
                            onClick={() => alert("Nomor VA berhasil disalin!")}
                            className="text-[10px] text-slate-500 hover:text-indigo-600 font-bold font-sans"
                          >
                            Salin
                          </button>
                        </div>
                      </div>
                      <ol className="list-decimal list-inside text-[9px] text-slate-400 space-y-0.5">
                        <li>Pilih Transfer &gt; BCA Virtual Account.</li>
                        <li>Masukkan nomor virtual account di atas.</li>
                        <li>Konfirmasi nominal dan selesaikan pembayaran.</li>
                      </ol>
                    </div>
                  )}

                  {mockSnapPaymentType === "cc" && (
                    <div className="w-full space-y-2 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Nomor Kartu Kredit</label>
                        <input 
                          type="text" 
                          placeholder="4111 1111 1111 1111" 
                          className="w-full bg-slate-50 border rounded-lg p-2 text-xs font-mono tracking-wider focus:outline-none focus:border-indigo-500" 
                          disabled 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Valid Thru</label>
                          <input 
                            type="text" 
                            placeholder="12/28" 
                            className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" 
                            disabled 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">CVV</label>
                          <input 
                            type="text" 
                            placeholder="123" 
                            className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" 
                            disabled 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="bg-slate-50 px-4 py-3 border-t flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMockSnapOpen(false)}
                  className="flex-1 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs transition-all"
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
                    await saveTransactionToLocal("Midtrans", mockSnapDetails.total, 0);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1 transition-all"
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
              <div className="bg-slate-100 py-1.5 text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-200/50 flex items-center justify-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Secured by Midtrans Encryption
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
