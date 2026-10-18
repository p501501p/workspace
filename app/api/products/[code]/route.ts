import { auth } from "@/app/auth";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { code } = await params;
  const product = await prisma.product.findUnique({ where: { code } });
  if (!product) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

function isProduct(data: unknown): data is {
  code: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
} {
  // ตรวจข้อมูลสินค้าฝั่งเซิร์ฟเวอร์ก่อนแก้ไข
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

export async function PUT(request: Request, { params }: Context) {
  // แก้ไขสินค้าได้เฉพาะผู้ดูแลระบบที่เข้าสู่ระบบแล้ว
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

  const { code: productCode } = await params;
  const product = await prisma.product.findUnique({ where: { code: productCode } });
  if (!product) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }

  const code = data.code.trim();
  const duplicate = await prisma.product.findFirst({
    where: { code, NOT: { id: product.id } },
  });
  if (duplicate) {
    return NextResponse.json({ error: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
  }

  // UPDATE: บันทึกค่าที่ผ่านการตรวจสอบลงฐานข้อมูล
  const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: {
      code,
      name: data.name.trim(),
      category: data.category.trim(),
      price: data.price,
      quantity: data.quantity,
    },
  });

  return NextResponse.json({ product: updatedProduct });
}

export async function DELETE(_request: Request, { params }: Context) {
  // ลบสินค้าได้เฉพาะผู้ดูแลระบบที่เข้าสู่ระบบแล้ว
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  }

  const { code } = await params;
  const product = await prisma.product.findUnique({ where: { code } });
  if (!product) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }

  // DELETE: ลบรายการเมื่อพบสินค้าตาม code ใน URL
  await prisma.product.delete({ where: { id: product.id } });
  return NextResponse.json({ success: true });
}
