import { auth } from "@/app/auth";
import prisma from "@/app/lib/prisma";
import { productSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

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
  const validation = productSchema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }
  const productData = validation.data;

  // ป้องกันการใช้รหัสสินค้าซ้ำก่อนสร้างรายการใหม่
  const code = productData.code;
  const existing = await prisma.product.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
  }

  // สร้าง record ใหม่ด้วยค่าที่ผ่านการตรวจสอบและปรับช่องว่างแล้ว
  const product = await prisma.product.create({
    data: {
      code,
      name: productData.name,
      category: productData.category,
      price: productData.price,
      quantity: productData.quantity,
      imageUrl: productData.imageUrl ?? null,
    },
  });

  // สถานะ 201 หมายถึงสร้างสินค้าใหม่สำเร็จ
  return NextResponse.json({ product }, { status: 201 });
}
