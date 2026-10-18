import { auth } from "@/app/auth";
import prisma from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function isProduct(data: unknown): data is {
  code: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
} {
  // ตรวจชนิด ค่าว่าง ความยาว และค่าตัวเลขก่อนรับข้อมูลจาก API
  if (typeof data !== "object" || data === null) return false;

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
    (product.quantity as number) >= 0
  );
}

export async function GET(request: NextRequest) {
  // ยืนยันตัวตนก่อนอนุญาตให้อ่านรายการสินค้า
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length > 100) {
    return NextResponse.json({ error: "คำค้นหายาวเกินไป" }, { status: 400 });
  }

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

  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  // เพิ่มสินค้าได้เฉพาะผู้ดูแลระบบที่เข้าสู่ระบบแล้ว
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  if (!isProduct(data)) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลสินค้าให้ถูกต้อง" }, { status: 400 });
  }

  // ป้องกันการใช้รหัสสินค้าซ้ำก่อนสร้างรายการใหม่
  const code = data.code.trim();
  const existing = await prisma.product.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      code,
      name: data.name.trim(),
      category: data.category.trim(),
      price: data.price,
      quantity: data.quantity,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
