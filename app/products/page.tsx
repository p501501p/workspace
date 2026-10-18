import { auth, signOut } from "@/app/auth";
import { redirect } from "next/navigation";
import ProductsClient from "./products-client";

export const instant = false;

async function logout() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function ProductsPage() {
  // AUTHENTICATION: ผู้ที่ยังไม่เข้าสู่ระบบจะถูกส่งไปยังหน้า login
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">จัดการข้อมูลสินค้า</h1>
          <p className="mt-1 text-slate-600">
            เข้าสู่ระบบในชื่อ {session.user.name ?? session.user.email}
          </p>
        </div>
        <form action={logout}>
          <button className="rounded border px-4 py-2">ออกจากระบบ</button>
        </form>
      </header>
      {/* ส่งสถานะผู้ดูแลไปควบคุมการแสดงปุ่มจัดการในหน้า */}
      <ProductsClient isAdmin={session.user.role === "ADMIN"} />
    </main>
  );
}
