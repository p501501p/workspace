"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { productSchema } from "@/app/lib/validation";

type Product = {
  // id ใช้เป็น key ภายใน React; code เป็นรหัสสินค้าที่ผู้ใช้เห็น
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
};

// แสดงรูปสินค้าจาก URL; ถ้าไม่มีรูปหรือโหลดไม่สำเร็จจะแสดงภาพแทน
function ProductImage({ src, alt }: { src: string | null; alt: string }) {
  // เก็บ URL ที่โหลดไม่สำเร็จ เพื่อแสดง placeholder แทนรูปที่เสีย
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // ไม่มี URL หรือ URL ปัจจุบันโหลดไม่สำเร็จ ให้แสดงภาพแทน
  if (!src || failedSrc === src) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200" role="img" aria-label={`${alt} ไม่มีรูปภาพ`}>
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <svg aria-hidden="true" viewBox="0 0 48 48" className="h-12 w-12 fill-none stroke-current" strokeWidth="1.5">
            <rect x="7" y="9" width="34" height="30" rx="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m9 34 10-9 6 5 5-4 9 8" />
          </svg>
          <span className="text-xs font-medium">ไม่มีรูปภาพ</span>
        </div>
      </div>
    );
  }

  // แสดงรูปจาก URL; onError จะสลับไปใช้ placeholder หากโหลดไม่สำเร็จ
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        onError={() => setFailedSrc(src)}
        className="object-cover transition duration-300 group-hover:scale-[1.03]"
      />
    </div>
  );
}

// READ: โหลดรายการสินค้าจาก API แล้วแปลงผลลัพธ์เป็นข้อมูล Product
async function loadProducts(): Promise<Product[]> {
  const response = await fetch("/api/products");
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "โหลดสินค้าไม่สำเร็จ");
  return result.products;
}

export default function ProductsClient({ isAdmin }: { isAdmin: boolean }) {
  // เก็บข้อมูลสินค้า ค่าค้นหา ตัวกรอง สถานะแก้ไข และข้อความแจ้งผล
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [message, setMessage] = useState("");

  // โหลดข้อมูลสินค้าครั้งแรก; active ป้องกันการอัปเดต state หลัง component ถูกถอดออก
  useEffect(() => {
    let active = true;
    loadProducts()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "โหลดสินค้าไม่สำเร็จ");
      });

    return () => {
      active = false;
    };
  }, []);

  // โหลดรายการล่าสุดอีกครั้งหลังมีการเพิ่ม แก้ไข หรือลบสินค้า
  async function refresh() {
    setProducts(await loadProducts());
  }

  // สร้างรายการหมวดหมู่ไม่ซ้ำสำหรับ dropdown
  const categories = Array.from(new Set(products.map((product) => product.category))).sort((a, b) =>
    a.localeCompare(b, "th-TH"),
  );
  // SEARCH + FILTER: กรองรายการตามคำค้นหา หมวดหมู่ และราคาสูงสุด
  const filteredProducts = products.filter((product) => {
    // ตัดช่องว่างหัวท้ายและแปลงเป็นตัวพิมพ์เล็ก เพื่อให้ค้นหาเทียบข้อความได้สะดวก
    const normalizedQuery = search.trim().toLocaleLowerCase("th-TH");
    // ค้นหาคำในรหัส ชื่อ หรือหมวดหมู่; ถ้าไม่ได้พิมพ์คำค้น ให้ถือว่าผ่านเงื่อนไขนี้
    const matchesSearch =
      !normalizedQuery ||
      [product.code, product.name, product.category].some((value) =>
        value.toLocaleLowerCase("th-TH").includes(normalizedQuery),
      );
    // ถ้าเลือกทุกหมวดหมู่ ให้ผ่าน; มิฉะนั้นต้องตรงกับหมวดหมู่ที่เลือก
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    // ถ้าไม่ได้กำหนดราคาสูงสุด ให้ผ่าน; มิฉะนั้นราคาสินค้าต้องไม่เกินค่าที่กำหนด
    const matchesPrice = maxPrice === "" || product.price <= Number(maxPrice);
    // แสดงสินค้าเมื่อผ่านทั้งการค้นหา หมวดหมู่ และราคา
    return matchesSearch && matchesCategory && matchesPrice;
  });
  // คำนวณตัวเลขสรุปที่แสดงบนการ์ดด้านบน
  const totalQuantity = products.reduce((total, product) => total + product.quantity, 0);

  // CREATE / UPDATE: อ่านค่าจากฟอร์มและส่งไป API ตามโหมดเพิ่มหรือแก้ไข
  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    // อ่านค่าจากฟอร์มและแปลงให้อยู่ในรูปแบบที่ API รับ รวมถึง URL รูปที่ไม่บังคับ
    const product = {
      code: data.get("code"),
      name: data.get("name"),
      category: data.get("category"),
      price: Number(data.get("price")),
      quantity: Number(data.get("quantity")),
      imageUrl: data.get("imageUrl")?.toString().trim() || null,
    };
    const validation = productSchema.safeParse(product);
    if (!validation.success) {
      setMessage(validation.error.issues[0].message);
      return;
    }

    try {
      // CREATE ใช้ POST; UPDATE ใช้ PUT เมื่อกำลังแก้ไขสินค้าเดิม
      const response = await fetch(
        editing ? `/api/products/${encodeURIComponent(editing.code)}` : "/api/products",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validation.data),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "บันทึกสินค้าไม่สำเร็จ");
        return;
      }

      setMessage(editing ? "แก้ไขสินค้าแล้ว" : "เพิ่มสินค้าแล้ว");
      setEditing(null);
      form.reset();
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกสินค้าไม่สำเร็จ");
    }
  }

  // DELETE: ขอคำยืนยันก่อนลบ และโหลดรายการล่าสุดหลังลบสำเร็จ
  async function deleteProduct(product: Product) {
    if (!window.confirm(`ต้องการลบสินค้า "${product.name}" หรือไม่?`)) return;

    try {
      // DELETE: ลบสินค้าผ่าน API หลังผู้ใช้ยืนยัน
      const response = await fetch(`/api/products/${encodeURIComponent(product.code)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "ลบสินค้าไม่สำเร็จ");
        return;
      }

      setMessage("ลบสินค้าแล้ว");
      if (editing?.id === product.id) setEditing(null);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ลบสินค้าไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-6">
      {/* แสดงภาพรวมจำนวนสินค้า หมวดหมู่ และจำนวนคงเหลือ */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <span className="absolute inset-y-0 left-0 w-1 bg-sky-500" />
          <p className="text-sm font-medium text-slate-500">สินค้าทั้งหมด</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{products.length}<span className="ml-2 text-sm font-medium text-slate-500">รายการ</span></p>
          <p className="mt-2 text-xs text-slate-400">รายการในคลังสินค้า</p>
        </article>
        <article className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <span className="absolute inset-y-0 left-0 w-1 bg-violet-500" />
          <p className="text-sm font-medium text-slate-500">หมวดหมู่</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{categories.length}<span className="ml-2 text-sm font-medium text-slate-500">ประเภท</span></p>
          <p className="mt-2 text-xs text-slate-400">ประเภทสินค้าที่จัดเก็บ</p>
        </article>
        <article className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <span className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
          <p className="text-sm font-medium text-slate-500">จำนวนคงเหลือ</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{totalQuantity.toLocaleString("th-TH")}<span className="ml-2 text-sm font-medium text-slate-500">ชิ้น</span></p>
          <p className="mt-2 text-xs text-slate-400">ยอดรวมสินค้าทุกประเภท</p>
        </article>
      </section>

      {isAdmin && (
        /* ฟอร์มนี้แสดงเฉพาะผู้ดูแลระบบ และใช้ได้ทั้งเพิ่มกับแก้ไขสินค้า */
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{editing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>
              <p className="mt-1 text-sm text-slate-500">{editing ? "ปรับปรุงรายละเอียดสินค้าในคลัง" : "กรอกรายละเอียดเพื่อเพิ่มสินค้าเข้าคลัง"}</p>
            </div>
            {editing && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">กำลังแก้ไข</span>}
          </div>
          <form key={editing?.id ?? "new"} onSubmit={saveProduct} className="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* defaultValue ใส่ค่าเดิมตอนแก้ไข; ถ้าเพิ่มสินค้าใหม่ช่องจะว่าง */}
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">รหัสสินค้า</span>
            <input name="code" required maxLength={30} defaultValue={editing?.code} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">ชื่อสินค้า</span>
            <input name="name" required maxLength={100} defaultValue={editing?.name} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">หมวดหมู่</span>
            <input name="category" required maxLength={50} defaultValue={editing?.category} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">ราคา (บาท)</span>
            <input name="price" type="number" min="0" step="1" required defaultValue={editing?.price} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">จำนวนคงเหลือ</span>
            <input name="quantity" type="number" min="0" step="1" required defaultValue={editing?.quantity} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
          </label>
          <label className="sm:col-span-2 lg:col-span-3">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">URL รูปภาพ <span className="font-normal text-slate-400">(ไม่บังคับ)</span></span>
            <input
              name="imageUrl"
              type="url"
              maxLength={2048}
              defaultValue={editing?.imageUrl ?? ""}
              placeholder="https://example.com/product-image.jpg"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
            <span className="mt-1 block text-xs text-slate-500">วางลิงก์รูปภาพสาธารณะ หากไม่ใส่ระบบจะแสดงภาพตัวอย่างแทน</span>
          </label>
          <div className="flex items-end gap-2 lg:col-span-3">
            <button className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2">
              {editing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                ยกเลิก
              </button>
            )}
          </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {/* ส่วนหัวและจำนวนผลลัพธ์ของรายการสินค้า */}
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">รายการสินค้า</h2>
              <p className="mt-1 text-sm text-slate-500">ค้นหาและกรองรายการสินค้าในคลัง</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tabular-nums text-slate-600">
              {filteredProducts.length} / {products.length} รายการ
            </span>
          </div>
          {!isAdmin && <p className="mt-3 text-sm text-slate-500">เฉพาะบัญชีผู้ดูแลเท่านั้นที่เพิ่มหรือแก้ไขสินค้าได้</p>}
        </div>
        {/* ช่องค้นหาและตัวกรองทำงานกับรายการสินค้าที่โหลดมาแล้ว */}
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">ค้นหาสินค้า</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหารหัส ชื่อ หรือหมวดหมู่"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">หมวดหมู่</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">ราคาไม่เกิน (บาท)</span>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="ไม่จำกัด"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </label>
        </div>

        {message && <p role="status" className="mx-5 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 sm:mx-6">{message}</p>}
        {filteredProducts.length === 0 ? (
          // แยกข้อความกรณีคลังว่างออกจากกรณีไม่มีผลลัพธ์ตามตัวกรอง
          <div className="px-5 py-16 text-center sm:px-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">—</div>
            <p className="font-semibold text-slate-800">{products.length === 0 ? "ยังไม่มีสินค้า" : "ไม่พบสินค้าที่ตรงกับเงื่อนไข"}</p>
            <p className="mt-1 text-sm text-slate-500">{products.length === 0 ? "เพิ่มสินค้าเพื่อเริ่มจัดการรายการ" : "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"}</p>
          </div>
        ) : (
          /* แสดงสินค้าแต่ละชิ้นเป็นการ์ด พร้อมรูป รายละเอียด สต็อก และปุ่มจัดการ */
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article key={product.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
                <ProductImage src={product.imageUrl} alt={product.name} />
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-medium text-slate-600">{product.code}</span>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">{product.category}</span>
                  </div>
                  <h3 className="min-h-12 text-base font-semibold leading-6 text-slate-900">{product.name}</h3>
                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-xs text-slate-500">ราคา</p>
                      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{product.price.toLocaleString("th-TH")} <span className="text-xs font-medium text-slate-500">บาท</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">คงเหลือ</p>
                      <span className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums ${product.quantity > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${product.quantity > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {product.quantity > 0 ? `${product.quantity.toLocaleString("th-TH")} ชิ้น` : "หมด"}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                      <button onClick={() => setEditing(product)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">แก้ไข</button>
                      <button onClick={() => deleteProduct(product)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">ลบสินค้า</button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
