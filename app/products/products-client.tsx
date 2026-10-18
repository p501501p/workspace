"use client";

import { useEffect, useState, type FormEvent } from "react";

type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

// READ: โหลดรายการสินค้าจาก API
async function loadProducts(): Promise<Product[]> {
  const response = await fetch("/api/products");
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "โหลดสินค้าไม่สำเร็จ");
  return result.products;
}

export default function ProductsClient({ isAdmin }: { isAdmin: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [message, setMessage] = useState("");

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

  async function refresh() {
    setProducts(await loadProducts());
  }

  const categories = Array.from(new Set(products.map((product) => product.category))).sort((a, b) =>
    a.localeCompare(b, "th-TH"),
  );
  // SEARCH + FILTER: กรองรายการตามคำค้นหา หมวดหมู่ และราคาสูงสุด
  const filteredProducts = products.filter((product) => {
    const normalizedQuery = search.trim().toLocaleLowerCase("th-TH");
    const matchesSearch =
      !normalizedQuery ||
      [product.code, product.name, product.category].some((value) =>
        value.toLocaleLowerCase("th-TH").includes(normalizedQuery),
      );
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesPrice = maxPrice === "" || product.price <= Number(maxPrice);
    return matchesSearch && matchesCategory && matchesPrice;
  });

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    // ตรวจรูปแบบเบื้องต้นจากฟอร์ม; API ตรวจซ้ำก่อนบันทึกลงฐานข้อมูล
    const product = {
      code: data.get("code"),
      name: data.get("name"),
      category: data.get("category"),
      price: Number(data.get("price")),
      quantity: Number(data.get("quantity")),
    };

    try {
      // CREATE ใช้ POST; UPDATE ใช้ PUT เมื่อกำลังแก้ไขสินค้าเดิม
      const response = await fetch(
        editing ? `/api/products/${encodeURIComponent(editing.code)}` : "/api/products",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
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
      {isAdmin && (
        <section className="rounded border bg-white p-5">
          <h2 className="mb-3 text-xl font-bold">{editing ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</h2>
          <form key={editing?.id ?? "new"} onSubmit={saveProduct} className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block">รหัสสินค้า</span>
            <input name="code" required maxLength={30} defaultValue={editing?.code} className="w-full rounded border p-2" />
          </label>
          <label>
            <span className="mb-1 block">ชื่อสินค้า</span>
            <input name="name" required maxLength={100} defaultValue={editing?.name} className="w-full rounded border p-2" />
          </label>
          <label>
            <span className="mb-1 block">หมวดหมู่</span>
            <input name="category" required maxLength={50} defaultValue={editing?.category} className="w-full rounded border p-2" />
          </label>
          <label>
            <span className="mb-1 block">ราคา (บาท)</span>
            <input name="price" type="number" min="0" step="1" required defaultValue={editing?.price} className="w-full rounded border p-2" />
          </label>
          <label>
            <span className="mb-1 block">จำนวนคงเหลือ</span>
            <input name="quantity" type="number" min="0" step="1" required defaultValue={editing?.quantity} className="w-full rounded border p-2" />
          </label>
          <div className="flex items-end gap-2">
            <button className="rounded bg-blue-700 px-4 py-2 text-white">
              {editing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="rounded border px-4 py-2">
                ยกเลิก
              </button>
            )}
          </div>
          </form>
        </section>
      )}

      <section className="rounded border bg-white p-5">
        <h2 className="mb-3 text-xl font-bold">รายการสินค้า</h2>
        {!isAdmin && <p className="mb-3 text-slate-600">เข้าสู่ระบบเป็นผู้ดูแลเพื่อเพิ่มหรือแก้ไขสินค้า</p>}
        {/* ช่องค้นหาและตัวกรองทำงานกับรายการสินค้าที่โหลดมาแล้ว */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block">ค้นหาสินค้า</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหารหัส ชื่อ หรือหมวดหมู่"
              className="w-full rounded border p-2"
            />
          </label>
          <label>
            <span className="mb-1 block">หมวดหมู่</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block">ราคาไม่เกิน (บาท)</span>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="ไม่จำกัด"
              className="w-full rounded border p-2"
            />
          </label>
        </div>

        {message && <p role="status" className="mb-3 text-blue-800">{message}</p>}
        {filteredProducts.length === 0 ? (
          <p>{products.length === 0 ? "ยังไม่มีสินค้า" : "ไม่พบสินค้าที่ตรงกับเงื่อนไข"}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-2">รหัส</th>
                  <th className="p-2">สินค้า</th>
                  <th className="p-2">หมวดหมู่</th>
                  <th className="p-2">ราคา</th>
                  <th className="p-2">คงเหลือ</th>
                  <th className="p-2">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-2">{product.code}</td>
                    <td className="p-2">{product.name}</td>
                    <td className="p-2">{product.category}</td>
                    <td className="p-2">{product.price.toLocaleString("th-TH")} บาท</td>
                    <td className="p-2">{product.quantity}</td>
                    <td className="space-x-2 p-2">
                      {isAdmin && (
                        <>
                          <button onClick={() => setEditing(product)} className="text-blue-700 underline">แก้ไข</button>
                          <button onClick={() => deleteProduct(product)} className="text-red-700 underline">ลบ</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
