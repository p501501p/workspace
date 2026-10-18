import { signIn } from "@/app/auth";

export default function GithubLoginPage() {
  return (
    <main className="mx-auto mt-16 max-w-md rounded border bg-white p-6">
      <h1 className="text-2xl font-bold">เข้าสู่ระบบด้วย GitHub</h1>
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/products" });
        }}
      >
        <button className="mt-4 rounded bg-slate-900 px-4 py-2 text-white">
          เข้าสู่ระบบ
        </button>
      </form>
    </main>
  );
}