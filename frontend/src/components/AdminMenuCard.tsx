import React from "react";
import { Menu, Tenant } from "@/services/dbSimulator";
import { Pencil, Trash2 } from "lucide-react";

type Props = {
  menu: Menu;
  tenant?: Tenant;
  onEdit: (m: Menu) => void;
  onDelete: (id: string) => void;
  formatRupiah: (v: number) => string;
};

export default function AdminMenuCard({ menu, tenant, onEdit, onDelete, formatRupiah }: Props) {
  return (
    <div className="bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div className="relative h-40 bg-slate-800">
        <img src={menu.foto} alt={menu.nama_menu} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${menu.status === "ready" && menu.stok > 0 ? "bg-emerald-500/25 text-emerald-400" : "bg-rose-500/25 text-rose-400"}`}>
            {menu.status === "ready" && menu.stok > 0 ? "Ready" : "Habis"}
          </span>
        </div>
        <div className="absolute bottom-2 left-3">
          <span className="px-2 py-0.5 rounded bg-slate-900/60 backdrop-blur-sm text-white text-[9px] font-semibold">{menu.kategori}</span>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <span className="text-[9px] font-bold text-indigo-400 block uppercase truncate">{tenant ? tenant.nama_tenant : "Tenant"}</span>
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">{menu.nama_menu}</h3>
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/30">
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(menu.harga)}</span>
          <span className="text-slate-400">
            Stok: <b className="text-slate-700 dark:text-slate-300">{menu.stok}</b>
          </span>
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/40 flex justify-end gap-2 text-xs">
        <button onClick={() => onEdit(menu)} className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg border border-slate-200 dark:border-slate-800" title="Edit Menu">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(menu.id)} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-200 dark:border-slate-800" title="Hapus Menu">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
