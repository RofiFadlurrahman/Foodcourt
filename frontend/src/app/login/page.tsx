"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginFallbackRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page where users can select Admin or Tenant portal
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-2">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-500 font-semibold">Mengalihkan ke beranda...</span>
    </div>
  );
}
