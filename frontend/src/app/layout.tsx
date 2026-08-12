import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plaza Oleos Food Court — Sistem Kasir CloudFood",
  description: "Sistem kasir & laporan penjualan online untuk seluruh stan di Plaza Oleos Food Court, Lantai 2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${bricolage.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        {/* Midtrans Snap SDK — Sandbox */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key="Mid-client-R4hZlVBQk2PcDbWz"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
