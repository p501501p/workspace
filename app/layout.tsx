import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบยืม-คืนอุปกรณ์",
  description: "ระบบยืมและคืนอุปกรณ์",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">{children}</body>
    </html>
  );
}
