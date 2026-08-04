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

// Configurable Backend API URL
// Falls back to the local PHP backend if the environment variable is not defined.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");

// Helper for making API calls with credentials (session cookies)
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  // Extract user session from sessionStorage (specific to this tab)
  let userId = "";
  let userRole = "";
  let tenantId = "";
  if (typeof window !== "undefined") {
    const rawUser = window.sessionStorage.getItem("session_user");
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        userId = u.id || "";
        userRole = u.role || "";
      } catch {}
    }
    const rawTenant = window.sessionStorage.getItem("session_tenant");
    if (rawTenant) {
      try {
        const t = JSON.parse(rawTenant);
        tenantId = t.id || "";
      } catch {}
    }
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Session-User-ID": userId,
    "X-Session-User-Role": userRole,
    "X-Session-Tenant-ID": tenantId,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Critical: tells the browser to send/receive PHP session cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (err: any) {
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      throw new Error(`Gagal terhubung ke backend PHP di: ${url}. Pastikan server PHP Anda aktif, berjalan, dan URL di .env.local/dbSimulator.ts sudah benar.`);
    }
    throw err;
  }
}

// Empty stub to maintain compatibility with existing callers.
// Real DB is initialized & seeded on the PHP side.
export function initDB() {
  // Database initialized automatically server-side in db.php
}

export const dbSimulator = {
  // --- USERS API ---
  async getUsers(): Promise<User[]> {
    return apiFetch<User[]>("/users.php");
  },

  async saveUser(user: User): Promise<User> {
    const isNew = !user.id;
    return apiFetch<User>("/users.php", {
      method: isNew ? "POST" : "PUT",
      body: JSON.stringify(user),
    });
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await apiFetch<{ success: boolean }>("/users.php?id=" + encodeURIComponent(id), {
      method: "DELETE",
    });
    return res.success;
  },

  // --- TENANTS API ---
  async getTenants(): Promise<Tenant[]> {
    return apiFetch<Tenant[]>("/tenants.php");
  },

  async saveTenant(tenant: Tenant): Promise<Tenant> {
    const isNew = !tenant.id;
    return apiFetch<Tenant>("/tenants.php", {
      method: isNew ? "POST" : "PUT",
      body: JSON.stringify(tenant),
    });
  },

  async deleteTenant(id: string): Promise<boolean> {
    const res = await apiFetch<{ success: boolean }>("/tenants.php?id=" + encodeURIComponent(id), {
      method: "DELETE",
    });
    return res.success;
  },

  // --- MENUS API ---
  async getMenus(): Promise<Menu[]> {
    return apiFetch<Menu[]>("/menus.php");
  },

  async saveMenu(menu: Menu): Promise<Menu> {
    const isNew = !menu.id;
    return apiFetch<Menu>("/menus.php", {
      method: isNew ? "POST" : "PUT",
      body: JSON.stringify(menu),
    });
  },

  async deleteMenu(id: string): Promise<boolean> {
    const res = await apiFetch<{ success: boolean }>("/menus.php?id=" + encodeURIComponent(id), {
      method: "DELETE",
    });
    return res.success;
  },

  // --- TRANSACTIONS API ---
  async getTransactions(): Promise<Transaction[]> {
    return apiFetch<Transaction[]>("/transactions.php");
  },

  async addTransaction(tx: Omit<Transaction, "id" | "tanggal_transaksi">): Promise<Transaction> {
    return apiFetch<Transaction>("/transactions.php", {
      method: "POST",
      body: JSON.stringify(tx),
    });
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const res = await apiFetch<{ success: boolean }>("/transactions.php?id=" + encodeURIComponent(id), {
      method: "DELETE",
    });
    return res.success;
  },

  // --- CUSTOM AUTHENTICATION ---
  async login(username: string, passwordInput: string): Promise<{ user: User; tenant?: Tenant } | null> {
    return apiFetch<{ user: User; tenant?: Tenant }>("/auth/login.php", {
      method: "POST",
      body: JSON.stringify({ username, password: passwordInput }),
    });
  },

  // Custom addition: helper to log out user session on PHP side
  async logout(): Promise<boolean> {
    try {
      const res = await apiFetch<{ success: boolean }>("/auth/logout.php", {
        method: "POST",
      });
      return res.success;
    } catch (err) {
      console.warn("Logout failed:", err);
      return false;
    }
  },

  // --- ANALYTICS & STATS ---
  async getTenantStats(tenantId: string) {
    // Note: tenantId is ignored since the server automatically retrieves it from session for security.
    return apiFetch<any>("/stats/tenant.php");
  },

  async getAdminStats() {
    return apiFetch<any>("/stats/admin.php");
  },

  // --- SYSTEM BACKUP & RESTORE ---
  async exportBackup(): Promise<string> {
    const res = await apiFetch<any>("/backup.php");
    return JSON.stringify(res, null, 2);
  },

  async importBackup(jsonString: string): Promise<boolean> {
    try {
      const payload = JSON.parse(jsonString);
      const res = await apiFetch<{ success: boolean }>("/backup.php", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.success;
    } catch (err) {
      console.error("Import backup failed:", err);
      return false;
    }
  },
};

/* --- REFERENSI LOGIKA SIMULATOR LOCALSTORAGE LAMA (RETAINED FOR ROLLBACK) ---
const INITIAL_USERS: User[] = [...];
const INITIAL_TENANTS: Tenant[] = [...];
const INITIAL_MENUS: Menu[] = [...];
function generateSeedTransactions(): Transaction[] { ... }
const STORAGE_KEYS = { ... };

export const localDbSimulator = {
  async getUsers(): Promise<User[]> { ... },
  async saveUser(user: User): Promise<User> { ... },
  async deleteUser(id: string): Promise<boolean> { ... },
  async getTenants(): Promise<Tenant[]> { ... },
  async saveTenant(tenant: Tenant): Promise<Tenant> { ... },
  async deleteTenant(id: string): Promise<boolean> { ... },
  async getMenus(): Promise<Menu[]> { ... },
  async saveMenu(menu: Menu): Promise<Menu> { ... },
  async deleteMenu(id: string): Promise<boolean> { ... },
  async getTransactions(): Promise<Transaction[]> { ... },
  async addTransaction(tx: Omit<Transaction, "id" | "tanggal_transaksi">): Promise<Transaction> { ... },
  async deleteTransaction(id: string): Promise<boolean> { ... },
  async login(username: string, passwordInput: string): Promise<{ user: User; tenant?: Tenant } | null> { ... },
  async getTenantStats(tenantId: string) { ... },
  async getAdminStats() { ... },
  async exportBackup(): Promise<string> { ... },
  async importBackup(jsonString: string): Promise<boolean> { ... }
};
*/
