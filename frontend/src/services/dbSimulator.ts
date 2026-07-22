// src/services/dbSimulator.ts

export interface User {
  id: string;
  username: string;
  password?: string;
  role: "admin" | "tenant";
  fullName: string;
  email: string;
  avatar: string;
}

export interface Tenant {
  id: string;
  user_id: string;
  nama_tenant: string;
  nama_pemilik: string;
  hp: string;
  email: string;
  status: "active" | "inactive";
  foto: string;
}

export interface Menu {
  id: string;
  tenant_id: string;
  nama_menu: string;
  harga: number;
  kategori: "Makanan" | "Minuman" | "Cemilan";
  stok: number;
  status: "ready" | "empty";
  foto: string;
}

export interface Transaction {
  id: string;
  tenant_id: string;
  menu_id: string;
  jumlah: number;
  total_harga: number;
  tanggal_transaksi: string; // ISO String
  metode_pembayaran: "Cash" | "QRIS" | "Debit" | "Midtrans";
}

// Initial Mock Data
const INITIAL_USERS: User[] = [
  {
    id: "u-1",
    username: "admin",
    role: "admin",
    fullName: "Administrator Utama",
    email: "admin@foodcourt.cloud",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "u-2",
    username: "warung_eko",
    role: "tenant",
    fullName: "Eko Prasetyo",
    email: "eko@wonogiri.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "u-3",
    username: "kopi_rian",
    role: "tenant",
    fullName: "Rian Kurniawan",
    email: "rian@kenangansenja.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "u-4",
    username: "sushi_sari",
    role: "tenant",
    fullName: "Sari Wijaya",
    email: "sari@sushizen.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  },
];

const INITIAL_TENANTS: Tenant[] = [
  {
    id: "t-1",
    user_id: "u-2",
    nama_tenant: "Bakso Wonogiri Eko",
    nama_pemilik: "Eko Prasetyo",
    hp: "081234567890",
    email: "eko@wonogiri.com",
    status: "active",
    foto: "https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "t-2",
    user_id: "u-3",
    nama_tenant: "Kopi Kenangan Senja",
    nama_pemilik: "Rian Kurniawan",
    hp: "082345678901",
    email: "rian@kenangansenja.com",
    status: "active",
    foto: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "t-3",
    user_id: "u-4",
    nama_tenant: "Sushi Zen Sari",
    nama_pemilik: "Sari Wijaya",
    hp: "083456789012",
    email: "sari@sushizen.com",
    status: "active",
    foto: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80",
  },
];

const INITIAL_MENUS: Menu[] = [
  // Bakso Wonogiri Eko (t-1)
  {
    id: "m-1",
    tenant_id: "t-1",
    nama_menu: "Bakso Urat Spesial",
    harga: 25000,
    kategori: "Makanan",
    stok: 50,
    status: "ready",
    foto: "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "m-2",
    tenant_id: "t-1",
    nama_menu: "Mie Ayam Pangsit Bakso",
    harga: 22000,
    kategori: "Makanan",
    stok: 40,
    status: "ready",
    foto: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "m-3",
    tenant_id: "t-1",
    nama_menu: "Es Teh Manis Segar",
    harga: 5000,
    kategori: "Minuman",
    stok: 100,
    status: "ready",
    foto: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=150&q=80",
  },
  // Kopi Kenangan Senja (t-2)
  {
    id: "m-4",
    tenant_id: "t-2",
    nama_menu: "Es Kopi Susu Senja",
    harga: 18000,
    kategori: "Minuman",
    stok: 80,
    status: "ready",
    foto: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "m-5",
    tenant_id: "t-2",
    nama_menu: "Classic Chocolate Ice",
    harga: 16000,
    kategori: "Minuman",
    stok: 60,
    status: "ready",
    foto: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "m-6",
    tenant_id: "t-2",
    nama_menu: "Roti Bakar Keju Meleleh",
    harga: 15000,
    kategori: "Cemilan",
    stok: 30,
    status: "ready",
    foto: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=150&q=80",
  },
  // Sushi Zen Sari (t-3)
  {
    id: "m-7",
    tenant_id: "t-3",
    nama_menu: "Salmon Mentai Roll",
    harga: 45000,
    kategori: "Makanan",
    stok: 25,
    status: "ready",
    foto: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "m-8",
    tenant_id: "t-3",
    nama_menu: "Chicken Katsu Curry",
    harga: 35000,
    kategori: "Makanan",
    stok: 30,
    status: "ready",
    foto: "https://images.unsplash.com/photo-1598511726623-d73400609951?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "m-9",
    tenant_id: "t-3",
    nama_menu: "Ocha Green Tea (Refill)",
    harga: 8000,
    kategori: "Minuman",
    stok: 150,
    status: "ready",
    foto: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=150&q=80",
  },
];

// Helper to generate dynamic transactions over the last 7 days
function generateSeedTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  const paymentMethods: Array<"Cash" | "QRIS" | "Debit" | "Midtrans"> = ["QRIS", "Cash", "Debit", "QRIS", "QRIS", "Midtrans"];

  // Seed menus with prices lookup
  const menuMap = new Map<string, { tenant_id: string; harga: number }>();
  INITIAL_MENUS.forEach((m) => {
    menuMap.set(m.id, { tenant_id: m.tenant_id, harga: m.harga });
  });

  let txCounter = 1;

  // Let's create transactions for the last 7 days
  for (let i = 7; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - i);

    // Number of transactions per day depends on the day (weekends are busier)
    const dayOfWeek = targetDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const txCount = isWeekend ? 25 + Math.floor(Math.random() * 15) : 12 + Math.floor(Math.random() * 10);

    for (let j = 0; j < txCount; j++) {
      // Pick random hour (peak times around lunch 11-13 and dinner 18-20)
      const isPeakHour = Math.random() > 0.4;
      let hour = 9 + Math.floor(Math.random() * 12); // default 9:00 to 21:00
      if (isPeakHour) {
        hour = Math.random() > 0.5 ? 12 + Math.floor(Math.random() * 2) : 18 + Math.floor(Math.random() * 2);
      }
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);

      const txDate = new Date(targetDate);
      txDate.setHours(hour, minute, second);

      // Skip future transactions
      if (txDate > now) continue;

      // Pick a random menu item
      const randomMenu = INITIAL_MENUS[Math.floor(Math.random() * INITIAL_MENUS.length)];
      const qty = 1 + Math.floor(Math.random() * 3);
      const total = randomMenu.harga * qty;
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      transactions.push({
        id: `tx-${txCounter++}`,
        tenant_id: randomMenu.tenant_id,
        menu_id: randomMenu.id,
        jumlah: qty,
        total_harga: total,
        tanggal_transaksi: txDate.toISOString(),
        metode_pembayaran: method,
      });
    }
  }

  return transactions;
}

const STORAGE_KEYS = {
  USERS: "foodcourt_users",
  TENANTS: "foodcourt_tenants",
  MENUS: "foodcourt_menus",
  TRANSACTIONS: "foodcourt_transactions",
  THEME: "foodcourt_theme",
};

// Initialize localStorage values if empty
export function initDB() {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TENANTS)) {
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(INITIAL_TENANTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MENUS)) {
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(INITIAL_MENUS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(generateSeedTransactions()));
  }
}

// Simulated Latency Helper
const delay = (ms: number = 10) => new Promise((resolve) => setTimeout(resolve, ms));

export const dbSimulator = {
  // --- USERS API ---
  async getUsers(): Promise<User[]> {
    await delay();
    initDB();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
  },

  async saveUser(user: User): Promise<User> {
    await delay();
    initDB();
    const users = await this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      user.id = `u-${Date.now()}`;
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return user;
  },

  async deleteUser(id: string): Promise<boolean> {
    await delay();
    initDB();
    let users = await this.getUsers();
    users = users.filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  },

  // --- TENANTS API ---
  async getTenants(): Promise<Tenant[]> {
    await delay();
    initDB();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TENANTS) || "[]");
  },

  async saveTenant(tenant: Tenant): Promise<Tenant> {
    await delay();
    initDB();
    const tenants = await this.getTenants();
    const idx = tenants.findIndex((t) => t.id === tenant.id);
    if (idx >= 0) {
      tenants[idx] = tenant;
    } else {
      tenant.id = `t-${Date.now()}`;
      tenants.push(tenant);
    }
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
    return tenant;
  },

  async deleteTenant(id: string): Promise<boolean> {
    await delay();
    initDB();
    let tenants = await this.getTenants();
    tenants = tenants.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));

    // Also delete all menus for this tenant
    let menus = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENUS) || "[]");
    menus = menus.filter((m: Menu) => m.tenant_id !== id);
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(menus));
    return true;
  },

  // --- MENUS API ---
  async getMenus(): Promise<Menu[]> {
    await delay();
    initDB();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MENUS) || "[]");
  },

  async saveMenu(menu: Menu): Promise<Menu> {
    await delay();
    initDB();
    const menus = await this.getMenus();
    const idx = menus.findIndex((m) => m.id === menu.id);
    if (idx >= 0) {
      menus[idx] = menu;
    } else {
      menu.id = `m-${Date.now()}`;
      menus.push(menu);
    }
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(menus));
    return menu;
  },

  async deleteMenu(id: string): Promise<boolean> {
    await delay();
    initDB();
    let menus = await this.getMenus();
    menus = menus.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(menus));
    return true;
  },

  // --- TRANSACTIONS API ---
  async getTransactions(): Promise<Transaction[]> {
    await delay();
    initDB();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || "[]");
  },

  async addTransaction(tx: Omit<Transaction, "id" | "tanggal_transaksi">): Promise<Transaction> {
    await delay();
    initDB();
    const transactions = await this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      tanggal_transaksi: new Date().toISOString(),
    };
    transactions.push(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

    // Deduct stock if menu exists
    const menus = await this.getMenus();
    const menuIdx = menus.findIndex((m) => m.id === tx.menu_id);
    if (menuIdx >= 0 && menus[menuIdx].stok >= tx.jumlah) {
      menus[menuIdx].stok -= tx.jumlah;
      if (menus[menuIdx].stok === 0) {
        menus[menuIdx].status = "empty";
      }
      localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(menus));
    }

    return newTx;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    await delay();
    initDB();
    let transactions = await this.getTransactions();
    transactions = transactions.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return true;
  },

  // --- CUSTOM AUTHENTICATION ---
  async login(username: string, passwordInput: string): Promise<{ user: User; tenant?: Tenant } | null> {
    await delay(600); // slightly longer load for natural feel
    initDB();
    const users = await this.getUsers();

    // Verifikasi username & password
    const user = users.find((u) => u.username === username);
    if (!user) return null;

    const validMap: Record<string, string> = {
      admin: "admin123",
      warung_eko: "eko123",
      kopi_rian: "rian123",
      sushi_sari: "sari123",
    };

    const expectedPassword = user.password || validMap[user.username] || "123456";
    if (passwordInput !== expectedPassword) return null;

    if (user.role === "tenant") {
      const tenants = await this.getTenants();
      const tenant = tenants.find((t) => t.user_id === user.id);
      return { user, tenant };
    }

    return { user };
  },

  // --- ANALYTICS & STATS ---
  async getTenantStats(tenantId: string) {
    await delay();
    initDB();
    const transactions: Transaction[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || "[]");
    const menus: Menu[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENUS) || "[]");

    const tenantTx = transactions.filter((t) => t.tenant_id === tenantId);
    const tenantMenus = menus.filter((m) => m.tenant_id === tenantId);

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let revenueToday = 0;
    let revenueThisMonth = 0;
    let totalRevenue = 0;

    tenantTx.forEach((t) => {
      const txDate = new Date(t.tanggal_transaksi);
      totalRevenue += t.total_harga;

      if (txDate >= startOfToday) {
        revenueToday += t.total_harga;
      }
      if (txDate >= startOfThisMonth) {
        revenueThisMonth += t.total_harga;
      }
    });

    // Best seller menu calculation
    const menuQuantities: Record<string, number> = {};
    tenantTx.forEach((t) => {
      menuQuantities[t.menu_id] = (menuQuantities[t.menu_id] || 0) + t.jumlah;
    });

    let bestSellerMenuId = "";
    let maxQty = 0;
    Object.entries(menuQuantities).forEach(([mId, qty]) => {
      if (qty > maxQty) {
        maxQty = qty;
        bestSellerMenuId = mId;
      }
    });

    const bestSellerMenuName = menus.find((m) => m.id === bestSellerMenuId)?.nama_menu || "Belum Ada";

    // Daily revenue graph data (last 7 days)
    const dailyData: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      dailyData[dateStr] = 0;
    }

    tenantTx.forEach((t) => {
      const d = new Date(t.tanggal_transaksi);
      const dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      if (dateStr in dailyData) {
        dailyData[dateStr] += t.total_harga;
      }
    });

    const chartData = Object.entries(dailyData).map(([date, revenue]) => ({
      tanggal: date,
      pendapatan: revenue,
    }));

    return {
      revenueToday,
      revenueThisMonth,
      totalRevenue,
      totalSalesCount: tenantTx.length,
      bestSellerMenu: bestSellerMenuName,
      totalMenusCount: tenantMenus.length,
      chartData,
      recentTransactions: tenantTx.sort((a, b) => b.tanggal_transaksi.localeCompare(a.tanggal_transaksi)).slice(0, 5),
    };
  },

  async getAdminStats() {
    await delay();
    initDB();
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    const tenants: Tenant[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TENANTS) || "[]");
    const menus: Menu[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENUS) || "[]");
    const transactions: Transaction[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || "[]");

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let revenueToday = 0;
    let revenueThisMonth = 0;
    let totalRevenue = 0;

    transactions.forEach((t) => {
      const txDate = new Date(t.tanggal_transaksi);
      totalRevenue += t.total_harga;

      if (txDate >= startOfToday) {
        revenueToday += t.total_harga;
      }
      if (txDate >= startOfThisMonth) {
        revenueThisMonth += t.total_harga;
      }
    });

    // 1. Line Chart Pendapatan over past 7 days
    const dailyData: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      dailyData[dateStr] = 0;
    }
    transactions.forEach((t) => {
      const d = new Date(t.tanggal_transaksi);
      const dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      if (dateStr in dailyData) {
        dailyData[dateStr] += t.total_harga;
      }
    });
    const lineChartData = Object.entries(dailyData).map(([date, amount]) => ({
      tanggal: date,
      pendapatan: amount,
    }));

    // 2. Tenant performance (Total revenue and sales count per tenant)
    const tenantPerformance: Record<string, { name: string; revenue: number; transactions: number }> = {};
    tenants.forEach((t) => {
      tenantPerformance[t.id] = { name: t.nama_tenant, revenue: 0, transactions: 0 };
    });
    transactions.forEach((t) => {
      if (tenantPerformance[t.tenant_id]) {
        tenantPerformance[t.tenant_id].revenue += t.total_harga;
        tenantPerformance[t.tenant_id].transactions += 1;
      }
    });
    const barChartTenantPerformance = Object.entries(tenantPerformance).map(([id, data]) => ({
      id,
      name: data.name,
      pendapatan: data.revenue,
      transaksi: data.transactions,
    }));

    // 3. Best seller menu (Pie Chart)
    const menuSales: Record<string, { name: string; value: number }> = {};
    transactions.forEach((t) => {
      const menu = menus.find((m) => m.id === t.menu_id);
      if (menu) {
        if (!menuSales[t.menu_id]) {
          menuSales[t.menu_id] = { name: menu.nama_menu, value: 0 };
        }
        menuSales[t.menu_id].value += t.jumlah;
      }
    });
    const pieChartBestSellers = Object.values(menuSales)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5

    // 4. Hourly Sales Distribution (Jam Penjualan Terpadat)
    const hourBuckets = Array.from({ length: 13 }, (_, idx) => {
      const hour = 9 + idx; // 9:00 to 21:00
      return {
        label: `${hour.toString().padStart(2, "0")}:00`,
        hour,
        transaksi: 0,
        pendapatan: 0,
      };
    });
    transactions.forEach((t) => {
      const hr = new Date(t.tanggal_transaksi).getHours();
      const bucket = hourBuckets.find((b) => b.hour === hr);
      if (bucket) {
        bucket.transaksi += 1;
        bucket.pendapatan += t.total_harga;
      }
    });

    return {
      revenueToday,
      revenueThisMonth,
      totalRevenue,
      totalTenants: tenants.length,
      totalMenus: menus.length,
      totalUsers: users.length,
      totalTransactions: transactions.length,
      lineChartData,
      barChartTenantPerformance,
      pieChartBestSellers,
      hourDistribution: hourBuckets,
      recentTransactions: transactions.sort((a, b) => b.tanggal_transaksi.localeCompare(a.tanggal_transaksi)).slice(0, 6),
    };
  },

  // --- SYSTEM BACKUP & RESTORE ---
  async exportBackup(): Promise<string> {
    await delay(500);
    initDB();
    const data = {
      users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]"),
      tenants: JSON.parse(localStorage.getItem(STORAGE_KEYS.TENANTS) || "[]"),
      menus: JSON.parse(localStorage.getItem(STORAGE_KEYS.MENUS) || "[]"),
      transactions: JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || "[]"),
    };
    return JSON.stringify(data, null, 2);
  },

  async importBackup(jsonString: string): Promise<boolean> {
    await delay(800);
    try {
      const data = JSON.parse(jsonString);
      if (data.users && data.tenants && data.menus && data.transactions) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
        localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(data.tenants));
        localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(data.menus));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
};
