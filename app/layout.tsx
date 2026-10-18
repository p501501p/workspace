import type { Metadata } from "next";
// นำสไตล์ส่วนกลางของแอปเข้ามาใช้กับทุกหน้า
import "./globals.css";

// กำหนดชื่อและคำอธิบายที่ใช้เป็น metadata ของเว็บไซต์
export const metadata: Metadata = {
  title: "ระบบจัดการคลังสินค้า",
  description: "ระบบจัดการคลังสินค้า",
};

// Root layout เป็นโครง HTML หลักที่ครอบทุก route ในแอป
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      {/* แสดงเนื้อหาของหน้าปัจจุบันภายใน body */}
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">{children}</body>
    </html>
  );
}
