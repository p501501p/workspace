"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type SignUpState } from "@/app/signup/actions";

const initialState: SignUpState = {};

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <main className="mx-auto mt-12 max-w-md rounded border bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">สมัครสมาชิก</h1>
      <form action={formAction} className="space-y-3">
        <label className="block">
          <span className="mb-1 block">ชื่อ</span>
          <input name="name" required className="w-full rounded border p-2" />
        </label>
        <label className="block">
          <span className="mb-1 block">อีเมล</span>
          <input name="email" type="email" required className="w-full rounded border p-2" />
        </label>
        <label className="block">
          <span className="mb-1 block">รหัสผ่าน (อย่างน้อย 6 ตัว)</span>
          <input name="password" type="password" minLength={6} required className="w-full rounded border p-2" />
        </label>
        <label className="block">
          <span className="mb-1 block">ยืนยันรหัสผ่าน</span>
          <input name="confirmPassword" type="password" minLength={6} required className="w-full rounded border p-2" />
        </label>
        {state.error && <p className="text-red-700">{state.error}</p>}
        <button disabled={pending} className="w-full rounded bg-blue-700 p-2 text-white disabled:opacity-50">
          {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>
      </form>
      <p className="mt-4 text-center">
        มีบัญชีแล้ว? <Link href="/login" className="text-blue-700 underline">เข้าสู่ระบบ</Link>
      </p>
    </main>
  );
}
