import { auth } from "@/app/auth";
import prisma from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ตรวจสอบข้อมูล product จาก request body ก่อนบันทึกลงฐานข้อมูล
function isProduct(data: unknown): data is {
  code: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
} {
  // ตรวจชนิด ค่าว่าง ความยาว และค่าตัวเลขก่อนรับข้อมูลจาก API
  if (typeof data !== "object" || data === null) return false;

  // ใช้ Record เพื่ออ่าน property จากข้อมูลที่ยังไม่ทราบชนิด
  const product = data as Record<string, unknown>;
  return (
    typeof product.code === "string" &&
    product.code.trim().length > 0 &&
    product.code.trim().length <= 30 &&
    typeof product.name === "string" &&
    product.name.trim().length > 0 &&
    product.name.trim().length <= 100 &&
    typeof product.category === "string" &&
    product.category.trim().length > 0 &&
    product.category.trim().length <= 50 &&
    Number.isInteger(product.price) &&
    (product.price as number) >= 0 &&
    Number.isInteger(product.quantity) &&
    (product.quantity as number) >= 0 &&
    isOptionalImageUrl(product.imageUrl)
  );
}

// imageUrl เป็นข้อมูลเสริม; หากส่งมาต้องเป็น URL HTTP(S) ที่ถูกต้อง
function isOptionalImageUrl(value: unknown): value is string | null | undefined {
  if (value === undefined || value === null) return true;
  if (typeof value !== "string" || value.trim().length > 2048) return false;
  if (value.trim() === "") return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    // URL constructor โยน error เมื่อข้อความไม่ใช่ URL ที่ถูกต้อง
    return false;
  }
}

// GET /api/products: ค้นหาและส่งคืนรายการสินค้าตาม query ที่ระบุ
export async function GET(request: NextRequest) {
  // ยืนยันตัวตนก่อนอนุญาตให้อ่านรายการสินค้า
  const session = await auth();
  // ผู้ที่ไม่มี session ต้องเข้าสู่ระบบก่อนเรียกดูสินค้า
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  // อ่านคำค้นหา q จาก URL และปฏิเสธคำค้นหาที่เกินความยาวที่กำหนด
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length > 100) {
    return NextResponse.json({ error: "คำค้นหายาวเกินไป" }, { status: 400 });
  }

  // ค้นหาคำในรหัส ชื่อ หรือหมวดหมู่ และเรียงตามชื่อสินค้า
  const products = await prisma.product.findMany({
    where: query
      ? {
          OR: [
            { code: { contains: query } },
            { name: { contains: query } },
            { category: { contains: query } },
          ],
        }
      : {},
    orderBy: { name: "asc" },
  });

  // ตอบกลับรายการสินค้าในรูปแบบ JSON
  return NextResponse.json({ products });
}

// POST /api/products: เพิ่มสินค้าใหม่สำหรับผู้ดูแลระบบ
export async function POST(request: NextRequest) {
  // เพิ่มสินค้าได้เฉพาะผู้ดูแลระบบที่เข้าสู่ระบบแล้ว
  const session = await auth();
  // แยกกรณียังไม่เข้าสู่ระบบออกจากกรณีไม่มีสิทธิ์ผู้ดูแล
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  }

  let data: unknown;
  try {
    // แปลง request body จาก JSON เพื่อเตรียมตรวจสอบข้อมูล
    data = await request.json();
  } catch {
    // รูปแบบ body ที่อ่านเป็น JSON ไม่ได้ถือเป็นคำขอผิดรูปแบบ
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  // ปฏิเสธข้อมูลที่ไม่ผ่าน validation ก่อนอ่าน/เขียนฐานข้อมูล
  if (!isProduct(data)) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลสินค้าให้ถูกต้อง" }, { status: 400 });
  }

  // ป้องกันการใช้รหัสสินค้าซ้ำก่อนสร้างรายการใหม่
  const code = data.code.trim();
  const existing = await prisma.product.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
  }

  // สร้าง record ใหม่ด้วยค่าที่ผ่านการตรวจสอบและปรับช่องว่างแล้ว
  const product = await prisma.product.create({
    data: {
      code,
      name: data.name.trim(),
      category: data.category.trim(),
      price: data.price,
      quantity: data.quantity,
      imageUrl: typeof data.imageUrl === "string" && data.imageUrl.trim() ? data.imageUrl.trim() : null,
    },
  });

  // สถานะ 201 หมายถึงสร้างสินค้าใหม่สำเร็จ
  return NextResponse.json({ product }, { status: 201 });
}
