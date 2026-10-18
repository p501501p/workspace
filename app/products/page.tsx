import { auth, signOut } from "@/app/auth";
import { redirect } from "next/navigation";
import ProductsClient from "./products-client";

// ปิดการแสดงผลแบบ instant สำหรับ route นี้
export const instant = false;

// Server Action สำหรับออกจากระบบ แล้วกลับไปหน้า login
async function logout() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function ProductsPage() {
  // AUTHENTICATION: ผู้ที่ยังไม่เข้าสู่ระบบจะถูกส่งไปยังหน้า login
  const session = await auth();
  // ถ้าไม่มี session หรือไม่มีรหัสผู้ใช้ ให้เข้าสู่ระบบก่อนใช้งานหน้านี้
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-4 py-5 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between bg-slate-950 px-5 py-3 text-xs text-slate-300 sm:px-7">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400 text-xs font-black text-slate-950">S</span>
              <span className="font-semibold tracking-wide text-white">STOCKROOM</span>
              <span className="hidden text-slate-500 sm:inline">/</span>
              <span className="hidden sm:inline">ระบบจัดการคลังสินค้า</span>
            </div>
            <span className="hidden uppercase tracking-widest text-slate-400 sm:inline">Inventory management</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-7 sm:py-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">ภาพรวมคลังสินค้า</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">จัดการสินค้า</h1>
              <p className="mt-2 text-sm text-slate-500">ดูแลรายการสินค้าและตรวจสอบสต็อกได้ในที่เดียว</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs text-slate-500">บัญชีผู้ใช้</p>
                <p className="mt-0.5 max-w-48 truncate text-sm font-semibold text-slate-800">{session.user.name ?? session.user.email}</p>
              </div>
              <span className="hidden h-9 w-px bg-slate-200 sm:block" />
              {/* ส่งคำขอออกจากระบบผ่าน Server Action */}
              <form action={logout}>
                <button className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2">
                  ออกจากระบบ
                </button>
              </form>
            </div>
          </div>
        </header>
        {/* ส่งสถานะผู้ดูแลไปควบคุมการแสดงปุ่มจัดการในหน้า */}
        <ProductsClient isAdmin={session.user.role === "ADMIN"} />
        <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          <span>Stockroom · Inventory management</span>
          <span>Product catalog</span>
        </footer>
      </div>
    </main>
  );
}
