import { signIn } from "@/app/auth";

// แสดงหน้าสำหรับเริ่มเข้าสู่ระบบผ่านผู้ให้บริการ GitHub
export default function GithubLoginPage() {
  return (
    <main className="mx-auto mt-16 max-w-md rounded border bg-white p-6">
      <h1 className="text-2xl font-bold">เข้าสู่ระบบด้วย GitHub</h1>
      <form
        action={async () => {
          // Server Action นี้เริ่ม OAuth จากฝั่ง server
          "use server";
          // ส่งผู้ใช้กลับไปหน้ารายการสินค้าหลัง GitHub ยืนยันตัวตนสำเร็จ
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