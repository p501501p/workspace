import { redirect } from "next/navigation";

// ส่งผู้ใช้จากหน้าแรกไปยังหน้ารายการสินค้า
export default function Home() {
  redirect("/products");
}
