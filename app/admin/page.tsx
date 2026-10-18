import { auth, signOut } from "@/app/auth";
import { redirect } from "next/navigation";

async function logout() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <p>เฉพาะ ADMIN เท่านั้น</p>

      <form action={logout} className="mt-4">
        <button type="submit" className="rounded bg-red-600 px-4 py-2 text-white">
          Logout
        </button>
      </form>
    </div>
  );
}