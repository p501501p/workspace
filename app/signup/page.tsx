"use client";

// ใช้ลิงก์นำทางไปหน้าเข้าสู่ระบบ
import Link from "next/link";
// จัดการสถานะการส่งฟอร์มและผลลัพธ์จาก Server Action
import { useActionState } from "react";
import { signUp, type SignUpState } from "@/app/signup/actions";

const initialState: SignUpState = {};

// แสดงฟอร์มสมัครบัญชีผู้ใช้ใหม่
export default function SignUpPage() {
  // state เก็บผลลัพธ์, formAction ใช้ส่งฟอร์ม, pending บอกว่ากำลังสมัคร
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f5f4] px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 md:min-h-[680px] md:grid-cols-[0.95fr_1.05fr]">
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
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">เริ่มต้นใช้งาน</p>
            <h2 className="mt-3 max-w-sm text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              สร้างบัญชี<br />เพื่อเข้าถึงคลังสินค้า
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50/70">
              สมัครสมาชิกเพื่อเข้าสู่ระบบและดูแลข้อมูลสินค้าได้อย่างสะดวกในที่เดียว
            </p>
          </div>
          <div className="mt-9 hidden items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:flex">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.6">
                <path d="M3 10.5 12 4l9 6.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9Z" />
                <path d="M8 21v-7h8v7M3 10.5h18M8 10.5V7.6m8 2.9V7.6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">จัดการคลังได้ง่ายขึ้น</p>
              <p className="mt-1 text-xs text-emerald-100/55">ข้อมูลสินค้าอยู่ในที่เดียว พร้อมค้นหาได้ทันที</p>
            </div>
          </div>
          <p className="mt-6 text-[10px] font-medium tracking-wide text-emerald-100/40">INVENTORY MANAGEMENT · 2026</p>
        </section>

        <section className="flex items-center justify-center px-6 py-9 sm:px-12 md:px-14">
          <div className="w-full max-w-sm">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">สร้างบัญชีผู้ใช้</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">สมัครสมาชิก</h1>
              <p className="mt-2 text-sm text-slate-500">กรอกข้อมูลด้านล่างเพื่อเริ่มใช้งาน</p>
            </div>

            {/* ส่งข้อมูลฟอร์มไปตรวจสอบและสร้างบัญชีใน Server Action */}
            <form action={formAction} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">ชื่อ</span>
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="ชื่อที่ใช้แสดงในระบบ"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                />
              </label>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">รหัสผ่าน</span>
                  <input
                    name="password"
                    type="password"
                    minLength={6}
                    required
                    autoComplete="new-password"
                    placeholder="รหัสผ่านต้องมีความยาวระหว่าง 6 ถึง 20 ตัวอักษร"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">ยืนยันรหัสผ่าน</span>
                  <input
                    name="confirmPassword"
                    type="password"
                    minLength={6}
                    required
                    autoComplete="new-password"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </label>
              </div>
              {state.error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>}
              <button disabled={pending} className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50">
                {pending ? "กำลังสมัคร..." : "สร้างบัญชี"}
              </button>
            </form>

            {/* ลิงก์สำหรับผู้ที่มีบัญชีอยู่แล้ว */}
            <p className="mt-7 text-center text-sm text-slate-500">
              มีบัญชีแล้ว? <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
