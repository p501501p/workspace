"use client";

import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    router.push("/products");
    router.refresh();
  }

  async function loginWithGitHub() {
    await signIn("github", { callbackUrl: "/products" });
  }

  return (
    <main className="mx-auto mt-16 max-w-md rounded border bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">เข้าสู่ระบบ</h1>
      <form onSubmit={login} className="space-y-3">
        <label className="block">
          <span className="mb-1 block">อีเมล</span>
          <input name="email" type="email" required className="w-full rounded border p-2" />
        </label>
        <label className="block">
          <span className="mb-1 block">รหัสผ่าน</span>
          <input name="password" type="password" required className="w-full rounded border p-2" />
        </label>
        {error && <p className="text-red-700">{error}</p>}
        <button className="w-full rounded bg-blue-700 p-2 text-white">เข้าสู่ระบบ</button>
      </form>

      <button
        type="button"
        onClick={loginWithGitHub}
        className="mt-3 w-full rounded border p-2"
      >
        เข้าสู่ระบบด้วย GitHub
      </button>

      <p className="mt-4 text-center">
        ยังไม่มีบัญชี? <Link href="/signup" className="text-blue-700 underline">สมัครสมาชิก</Link>
      </p>
    </main>
  );
}
