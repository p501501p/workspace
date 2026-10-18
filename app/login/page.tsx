"use client";

// เรียกใช้การเข้าสู่ระบบของ NextAuth จากฝั่ง browser
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
// ใช้นำทางไปหน้ารายการสินค้าหลังเข้าสู่ระบบ
import { useRouter } from "next/navigation";
// ใช้สร้างลิงก์ไปหน้าสมัครสมาชิก
import Link from "next/link";

// แสดงฟอร์มเข้าสู่ระบบด้วยอีเมล/รหัสผ่านหรือ GitHub
export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  // ตรวจ credentials ที่กรอก แล้วนำผู้ใช้ไปหน้าสินค้าหากเข้าสู่ระบบสำเร็จ
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    // แสดงข้อความผิดพลาดเมื่อ NextAuth ปฏิเสธข้อมูลเข้าสู่ระบบ
    if (result?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    router.push("/products");
    router.refresh();
  }

  // เริ่มขั้นตอน OAuth ของ GitHub และกลับมาที่หน้าสินค้าหลังสำเร็จ
  async function loginWithGitHub() {
    await signIn("github", { callbackUrl: "/products" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f5f4] px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 md:min-h-[620px] md:grid-cols-[0.95fr_1.05fr]">
        <section className="relative isolate flex min-h-56 flex-col justify-between overflow-hidden bg-[#102c27] p-7 text-white sm:p-10 md:min-h-full md:p-12">
          <div className="pointer-events-none absolute -right-20 -top-16 -z-10 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 -z-10 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300 text-lg font-black text-[#102c27]">S</span>
              <div>
                <p className="text-sm font-bold tracking-[0.16em]">STOCKROOM</p>
                <p className="mt-0.5 text-[11px] text-emerald-100/60">ระบบจัดการคลังสินค้า</p>
              </div>
            </div>
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">จัดการคลังอย่างเป็นระบบ</p>
            <h2 className="mt-3 max-w-sm text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              ทุกชิ้นในคลัง<br />พร้อมให้คุณดูแล
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50/70">
              เข้าสู่ระบบเพื่อจัดการรายการสินค้า ตรวจสอบหมวดหมู่ และติดตามจำนวนคงเหลือ
            </p>
          </div>
          <div className="mt-9 hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:block">
            <div className="mb-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/50">
              <span>Inventory overview</span>
              <span>01 — 03</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["รายการ", "หมวดหมู่", "คงเหลือ"].map((label, index) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="mb-3 h-1 w-7 rounded-full bg-emerald-300/70" />
                  <p className="text-xs font-medium text-white/85">{label}</p>
                  <p className="mt-1 text-[10px] text-emerald-100/45">{`ข้อมูลคลัง 0${index + 1}`}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-6 text-[10px] font-medium tracking-wide text-emerald-100/40">INVENTORY MANAGEMENT · 2026</p>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-12 md:px-14">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">ยินดีต้อนรับกลับ</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">เข้าสู่ระบบ</h1>
              <p className="mt-2 text-sm text-slate-500">กรอกข้อมูลบัญชีของคุณเพื่อดำเนินการต่อ</p>
            </div>

            {/* ฟอร์ม credentials สำหรับเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน */}
            <form onSubmit={login} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">อีเมล</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">รหัสผ่าน</span>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                />
              </label>
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              <button className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-600/20">
                เข้าสู่ระบบ
              </button>
            </form>

            {/* ปุ่มเริ่มเข้าสู่ระบบผ่าน GitHub */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">หรือเข้าสู่ระบบด้วย</span></div>
            </div>
            <button
              type="button"
              onClick={loginWithGitHub}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.11.08 1.7 1.15 1.7 1.15.99 1.69 2.6 1.2 3.23.91.1-.72.39-1.2.7-1.48-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.06 1.15a10.64 10.64 0 0 1 5.57 0c2.12-1.45 3.06-1.15 3.06-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.61 5.23-5.1 5.5.4.35.75 1.03.75 2.08v3.1c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
              </svg>
              เข้าสู่ระบบด้วย GitHub
            </button>

            {/* ลิงก์ไปสร้างบัญชีใหม่ */}
            <p className="mt-8 text-center text-sm text-slate-500">
              ยังไม่มีบัญชี? <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">สมัครสมาชิก</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
