"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { signUp, type SignUpState } from "@/app/signup/actions";

const initialState: SignUpState = {};

export default function SignUpPage() {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(signUp, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/login?registered=1");
    }
  }, [state.success, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
          Sign Up
        </h1>

        <p className="mb-6 text-center text-gray-500">สร้างบัญชีผู้ใช้งาน</p>

        <form action={formAction} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              ชื่อ
            </label>

            <input
              id="name"
              name="name"
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:border-blue-500 focus:outline-none"
              placeholder="ชื่อของคุณ"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:border-blue-500 focus:outline-none"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:border-blue-500 focus:outline-none"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              minLength={6}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:border-blue-500 focus:outline-none"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              minLength={6}
              required
            />
          </div>

          {/* Error */}
          {state.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {state.error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5
                       font-medium text-white
                       hover:bg-blue-700
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
          >
            {pending ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
          </button>
        </form>

        {/* Login */}
        <div className="mt-6 text-center text-sm text-gray-600">
          มีบัญชีอยู่แล้ว?
          <Link
            href="/login"
            className="ml-1 font-medium text-blue-600 hover:underline"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}