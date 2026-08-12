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

export interface ChartPoint {
  tanggal: string;
  pendapatan: number;
}

export interface AdminStats {
  revenueToday: number;
  revenueThisMonth: number;
  totalRevenue: number;
  totalTenants: number;
  totalMenus: number;
  totalUsers: number;
  totalTransactions: number;
  lineChartData: ChartPoint[];
  barChartTenantPerformance: {
    id: string;
    name: string;
    pendapatan: number;
    transaksi: number;
  }[];
  pieChartBestSellers: { name: string; value: number }[];
  hourDistribution: {
    label: string;
    hour: number;
    transaksi: number;
    pendapatan: number;
  }[];
  recentTransactions: Transaction[];
}

export interface TenantStats {
  revenueToday: number;
  revenueThisMonth: number;
  totalRevenue: number;
  totalSalesCount: number;
  bestSellerMenu: string;
  totalMenusCount: number;
  chartData: ChartPoint[];
  recentTransactions: Transaction[];
}

export interface BackupData {
  users?: User[];
  tenants?: Tenant[];
  menus?: Menu[];
  transactions?: Transaction[];
}

export interface Invitation {
  id: string;
  admin_id: string;
  code: string;
  email: string | null;
  status: "active" | "used" | "expired";
  expires_at: string;
  created_at?: string;
}

export interface InvitationValidation {
  valid: boolean;
  admin_id: string;
  admin_username: string;
  admin_fullName: string;
  email: string | null;
  expires_at: string;
}

export interface TenantRegistrationPayload {
  invitation_code: string;
  owner_name: string;
  tenant_name: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
}

export interface TenantRegistrationResult {
  success: boolean;
  message: string;
  data?: {
    tenant_id: number;
    admin_name: string;
  };
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

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {}
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseText) as T;
    } catch (parseErr) {
      // Check if response contains HTML tags (signature of PHP warning/error)
      if (responseText.includes("<br />") || responseText.includes("<b>Warning</b>") || responseText.includes("<b>Fatal error</b>")) {
        const cleanText = responseText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        throw new Error(`Server returned HTML warning/error instead of JSON: ${cleanText.substring(0, 150)}...`);
      }
      throw new Error(`Server returned invalid JSON response: ${responseText.substring(0, 100)}...`);
    }
  } catch (err: unknown) {
    if (
      err instanceof TypeError ||
      (err instanceof Error && err.message === "Failed to fetch")
    ) {
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

  // Upload gambar menu dari file lokal — pakai multipart/form-data
  async uploadMenuImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    // Baca session untuk auth headers
    let userId = "", userRole = "", tenantId = "";
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(window.sessionStorage.getItem("session_user") || "{}");
        userId = u.id || ""; userRole = u.role || "";
      } catch {}
      try {
        const t = JSON.parse(window.sessionStorage.getItem("session_tenant") || "{}");
        tenantId = t.id || "";
      } catch {}
    }

    const res = await fetch(`${API_BASE_URL}/upload/menu-image.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-Session-User-ID":   userId,
        "X-Session-User-Role": userRole,
        "X-Session-Tenant-ID": tenantId,
        // Jangan set Content-Type — biarkan browser set boundary multipart
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Upload gagal.");
    return data.url as string;
  },

  // Upload gambar profil (Avatar/Tenant Cover) dari file lokal — pakai multipart/form-data
  async uploadProfileImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    let userId = "", userRole = "", tenantId = "";
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(window.sessionStorage.getItem("session_user") || "{}");
        userId = u.id || ""; userRole = u.role || "";
      } catch {}
      try {
        const t = JSON.parse(window.sessionStorage.getItem("session_tenant") || "{}");
        tenantId = t.id || "";
      } catch {}
    }

    const res = await fetch(`${API_BASE_URL}/upload/profile-image.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-Session-User-ID":   userId,
        "X-Session-User-Role": userRole,
        "X-Session-Tenant-ID": tenantId,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Upload gambar profil gagal.");
    return data.url as string;
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
  async getTenantStats(): Promise<TenantStats> {
    // Tenant scope is resolved from the active session on the server.
    return apiFetch<TenantStats>("/stats/tenant.php");
  },

  async getAdminStats(): Promise<AdminStats> {
    return apiFetch<AdminStats>("/stats/admin.php");
  },

  // --- SYSTEM BACKUP & RESTORE ---
  async exportBackup(): Promise<string> {
    const res = await apiFetch<BackupData>("/backup.php");
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

  // --- INVITATIONS (KODE UNDANGAN) ---
  async getInvitations(): Promise<Invitation[]> {
    return apiFetch<Invitation[]>("/invitations.php");
  },

  async generateInvitation(opts?: { email?: string; expires_at?: string }): Promise<Invitation> {
    return apiFetch<Invitation>("/invitations.php", {
      method: "POST",
      body: JSON.stringify(opts || {}),
    });
  },

  async deleteInvitation(id: string): Promise<boolean> {
    const res = await apiFetch<{ success: boolean }>("/invitations.php?id=" + encodeURIComponent(id), {
      method: "DELETE",
    });
    return res.success;
  },

  // Validasi kode undangan — endpoint PUBLIC, tidak butuh login
  async validateInvitation(code: string): Promise<{ valid: boolean; admin_name?: string; message?: string }> {
    try {
      const res = await apiFetch<{ success: boolean; valid: boolean; invitation?: { admin_id: number; admin_name: string }; message?: string }>(
        "/auth/validate-invitation.php",
        { method: "POST", body: JSON.stringify({ code }) }
      );
      return {
        valid: res.valid,
        admin_name: res.invitation?.admin_name,
        message: res.message,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { valid: false, message: msg };
    }
  },

  // Registrasi tenant via invitation — endpoint PUBLIC, tidak butuh login
  async registerTenantWithInvitation(payload: TenantRegistrationPayload): Promise<TenantRegistrationResult> {
    return apiFetch<TenantRegistrationResult>("/auth/register-tenant.php", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Buat transaksi Midtrans — endpoint butuh tenant auth
  async createMidtransTransaction(payload: {
    menu_id: string;
    jumlah: number;
    total_harga: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  }): Promise<{
    snap_token: string;
    client_key: string;
    is_production: boolean;
    order_id: string;
    transaction_id: number;
    error?: string;
  }> {
    return apiFetch("/payment/create-transaction.php", {
      method: "POST",
      body: JSON.stringify(payload),
    });
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
