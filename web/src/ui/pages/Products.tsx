import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Product = { id: string; name: string; description?: string };
type Variant = {
  id?: string;
  productId?: string;
  sku: string;
  barcode?: string;
  weight_gram: number;
  stock_on_hand: number;
  price: number;
  default_purchase_price: number;
  default_operational_cost_unit: number;
  cogs_current: number;
};

type VariantForm = Omit<Variant, "id" | "productId">;

export function Products(): React.JSX.Element {
  const [products, setProducts] = useState<(Product & { variants: Variant[] })[]>([]);
  const [pForm, setPForm] = useState({ name: "", description: "" });
  const [productVariants, setProductVariants] = useState<VariantForm[]>([]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editPForm, setEditPForm] = useState({ name: "", description: "" });
  const [editVForm, setEditVForm] = useState<Partial<Variant>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ productId: string; productName: string } | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm>({
    sku: "",
    barcode: "",
    weight_gram: 0,
    stock_on_hand: 0,
    price: 0,
    default_purchase_price: 0,
    default_operational_cost_unit: 0,
    cogs_current: 0,
  });

  async function load() {
    const list = await api<(Product & { variants: Variant[] })[]>("/products");
    setProducts(list);
  }
  useEffect(() => { load().catch(() => undefined); }, []);

  function addVariantToProduct() {
    if (!variantForm.sku) {
      alert("SKU is required");
      return;
    }
    setProductVariants([...productVariants, { ...variantForm }]);
    setVariantForm({
      sku: "",
      barcode: "",
      weight_gram: 0,
      stock_on_hand: 0,
      price: 0,
      default_purchase_price: 0,
      default_operational_cost_unit: 0,
      cogs_current: 0,
    });
  }

  function removeVariantFromProduct(index: number) {
    setProductVariants(productVariants.filter((_, i) => i !== index));
  }

  function updateVariantInProduct(index: number, field: keyof VariantForm, value: string | number) {
    const updated = [...productVariants];
    (updated[index] as any)[field] = field === "sku" || field === "barcode" ? value : Number(value);
    setProductVariants(updated);
  }

  async function createProduct() {
    if (!pForm.name) {
      alert("Product name is required");
      return;
    }
    if (productVariants.length === 0) {
      alert("At least one variant is required");
      return;
    }
    
    try {
      await api("/products", {
        method: "POST",
        body: JSON.stringify({
          name: pForm.name,
          description: pForm.description,
          variants: productVariants,
        }),
      });
      setPForm({ name: "", description: "" });
      setProductVariants([]);
      setVariantForm({
        sku: "",
        barcode: "",
        weight_gram: 0,
        stock_on_hand: 0,
        price: 0,
        default_purchase_price: 0,
        default_operational_cost_unit: 0,
        cogs_current: 0,
      });
      await load();
    } catch (e: any) {
      alert("Error: " + (e.message || String(e)));
    }
  }

  async function updateProduct(productId: string) {
    if (!editPForm.name) return;
    await api(`/products/${productId}`, { method: "PATCH", body: JSON.stringify(editPForm) });
    setEditingProduct(null);
    await load();
  }

  async function deleteProduct(productId: string) {
    if (!deleteConfirm || deleteConfirm.productId !== productId) return;
    
    try {
      await api(`/products/${productId}`, { method: "DELETE" });
      setDeleteConfirm(null);
      await load();
    } catch (e: any) {
      alert("Error: " + (e.message || String(e)));
    }
  }

  async function createVariant(productId: string) {
    if (!variantForm.sku) {
      alert("SKU is required");
      return;
    }
    try {
      await api(`/products/${productId}/variants`, {
        method: "POST",
        body: JSON.stringify(variantForm),
      });
      setVariantForm({
        sku: "",
        barcode: "",
        weight_gram: 0,
        stock_on_hand: 0,
        price: 0,
        default_purchase_price: 0,
        default_operational_cost_unit: 0,
        cogs_current: 0,
      });
      await load();
    } catch (e: any) {
      alert("Error: " + (e.message || String(e)));
    }
  }

  async function updateVariant(variantId: string) {
    if (!editVForm.sku) {
      alert("SKU is required");
      return;
    }
    await api(`/products/variants/${variantId}`, { method: "PATCH", body: JSON.stringify(editVForm) });
    setEditingVariant(null);
    setEditVForm({});
    await load();
  }

  async function deleteVariant(variantId: string) {
    if (!confirm("Delete this variant?")) return;
    await api(`/products/variants/${variantId}`, { method: "DELETE" });
    await load();
  }

  function startEditProduct(p: Product) {
    setEditingProduct(p.id);
    setEditPForm({ name: p.name, description: p.description || "" });
  }

  function startEditVariant(v: Variant) {
    setEditingVariant(v.id!);
    setEditVForm({ ...v });
  }

  return (
    <div>
      <h2>Products</h2>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 8,
              maxWidth: 400,
              width: "90%",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Konfirmasi Hapus Produk</h3>
            <p>
              Apakah Anda yakin ingin menghapus produk <strong>"{deleteConfirm.productName}"</strong>?
            </p>
            <p style={{ color: "#dc3545", fontSize: "0.9em" }}>
              Peringatan: Semua variant produk ini juga akan ikut terhapus.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button
                onClick={() => deleteProduct(deleteConfirm.productId)}
                style={{ background: "#dc3545", color: "white", padding: "8px 16px" }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Form */}
      <div style={{ border: "1px solid #ddd", padding: 16, marginBottom: 24, borderRadius: 8 }}>
        <h3>Buat Produk Baru</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Nama Produk <span style={{ color: "red" }}>*</span>
            </label>
            <input
              style={{ width: "100%", padding: 8 }}
              value={pForm.name}
              onChange={(e) => setPForm({ ...pForm, name: e.target.value })}
              placeholder="Masukkan nama produk"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Deskripsi Produk
            </label>
            <input
              style={{ width: "100%", padding: 8 }}
              value={pForm.description}
              onChange={(e) => setPForm({ ...pForm, description: e.target.value })}
              placeholder="Masukkan deskripsi produk"
            />
          </div>

          {/* Variants untuk Product Baru */}
          <div style={{ borderTop: "1px solid #eee", paddingTop: 16, marginTop: 8 }}>
            <h4 style={{ marginTop: 0 }}>
              Variants <span style={{ color: "red" }}>*</span> (Minimal 1 variant)
            </h4>
            
            {/* Form untuk tambah variant */}
            <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 4, marginBottom: 12, backgroundColor: "#f9f9f9" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                    SKU <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    style={{ width: "100%", padding: 6 }}
                    value={variantForm.sku}
                    onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                    placeholder="Kode SKU"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>Barcode</label>
                  <input
                    style={{ width: "100%", padding: 6 }}
                    value={variantForm.barcode}
                    onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })}
                    placeholder="Barcode (opsional)"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                    Berat (gram) <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="number"
                    style={{ width: "100%", padding: 6 }}
                    value={variantForm.weight_gram}
                    onChange={(e) => setVariantForm({ ...variantForm, weight_gram: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                    Stok <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="number"
                    style={{ width: "100%", padding: 6 }}
                    value={variantForm.stock_on_hand}
                    onChange={(e) => setVariantForm({ ...variantForm, stock_on_hand: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                    Harga Jual <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="number"
                    style={{ width: "100%", padding: 6 }}
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                    Harga Beli Default
                  </label>
                  <input
                    type="number"
                    style={{ width: "100%", padding: 6 }}
                    value={variantForm.default_purchase_price}
                    onChange={(e) => setVariantForm({ ...variantForm, default_purchase_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                    Biaya Operasional/Unit
                  </label>
                  <input
                    type="number"
                    style={{ width: "100%", padding: 6 }}
                    value={variantForm.default_operational_cost_unit}
                    onChange={(e) => setVariantForm({ ...variantForm, default_operational_cost_unit: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>COGS Saat Ini</label>
                  <input
                    type="number"
                    style={{ width: "100%", padding: 6 }}
                    value={variantForm.cogs_current}
                    onChange={(e) => setVariantForm({ ...variantForm, cogs_current: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button onClick={addVariantToProduct} style={{ padding: "6px 12px" }}>
                + Tambah Variant
              </button>
            </div>

            {/* List variants yang sudah ditambahkan */}
            {productVariants.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <strong>Variants yang akan disimpan ({productVariants.length}):</strong>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {productVariants.map((v, idx) => (
                    <li key={idx} style={{ marginBottom: 8, padding: 8, backgroundColor: "#f0f0f0", borderRadius: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>
                          <strong>{v.sku}</strong> | {v.weight_gram}g | Stok: {v.stock_on_hand} | 
                          Harga: Rp {Number(v.price).toLocaleString("id-ID")}
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => {
                              setVariantForm(v);
                              removeVariantFromProduct(idx);
                            }}
                            style={{ fontSize: "0.85em", padding: "4px 8px" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeVariantFromProduct(idx)}
                            style={{ fontSize: "0.85em", padding: "4px 8px", background: "#dc3545", color: "white" }}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={createProduct}
              disabled={productVariants.length === 0}
              style={{
                padding: "10px 20px",
                fontSize: "1em",
                backgroundColor: productVariants.length === 0 ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: productVariants.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Simpan Produk dengan {productVariants.length} Variant
            </button>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div style={{ marginTop: 16 }}>
        <h3>Daftar Produk</h3>
        {products.length === 0 ? (
          <p>Tidak ada produk. Silakan buat produk baru.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} style={{ border: "1px solid #ddd", padding: 16, marginBottom: 16, borderRadius: 8 }}>
              {editingProduct === p.id ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                      Nama Produk <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      style={{ width: "100%", padding: 8 }}
                      value={editPForm.name}
                      onChange={(e) => setEditPForm({ ...editPForm, name: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Deskripsi</label>
                    <input
                      style={{ width: "100%", padding: 8 }}
                      value={editPForm.description}
                      onChange={(e) => setEditPForm({ ...editPForm, description: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => updateProduct(p.id)}>Simpan</button>
                    <button onClick={() => setEditingProduct(null)}>Batal</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <strong style={{ fontSize: "1.2em" }}>{p.name}</strong>
                    {p.description && <span style={{ color: "#666", marginLeft: 8 }}>— {p.description}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEditProduct(p)}>Edit Produk</button>
                    <button
                      onClick={() => setDeleteConfirm({ productId: p.id, productName: p.name })}
                      style={{ background: "#dc3545", color: "white" }}
                    >
                      Hapus Produk
                    </button>
                  </div>
                </div>
              )}

              {/* Variants List */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <strong>Variants ({p.variants.length})</strong>
                  {!editingProduct && (
                    <button onClick={() => createVariant(p.id)} style={{ fontSize: "0.9em", padding: "4px 8px" }}>
                      + Tambah Variant Baru
                    </button>
                  )}
                </div>
                {p.variants.length === 0 ? (
                  <p style={{ color: "#999", fontStyle: "italic" }}>Tidak ada variant. Tambahkan variant baru.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {p.variants.map((v) => (
                      <li key={v.id} style={{ marginBottom: 12, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 4 }}>
                        {editingVariant === v.id ? (
                          <div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 8 }}>
                              <div>
                                <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                                  SKU <span style={{ color: "red" }}>*</span>
                                </label>
                                <input
                                  style={{ width: "100%", padding: 6 }}
                                  value={editVForm.sku || ""}
                                  onChange={(e) => setEditVForm({ ...editVForm, sku: e.target.value })}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>Barcode</label>
                                <input
                                  style={{ width: "100%", padding: 6 }}
                                  value={editVForm.barcode || ""}
                                  onChange={(e) => setEditVForm({ ...editVForm, barcode: e.target.value })}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                                  Berat (gram)
                                </label>
                                <input
                                  type="number"
                                  style={{ width: "100%", padding: 6 }}
                                  value={editVForm.weight_gram || 0}
                                  onChange={(e) => setEditVForm({ ...editVForm, weight_gram: Number(e.target.value) })}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>Stok</label>
                                <input
                                  type="number"
                                  style={{ width: "100%", padding: 6 }}
                                  value={editVForm.stock_on_hand || 0}
                                  onChange={(e) => setEditVForm({ ...editVForm, stock_on_hand: Number(e.target.value) })}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                                  Harga Jual
                                </label>
                                <input
                                  type="number"
                                  style={{ width: "100%", padding: 6 }}
                                  value={editVForm.price || 0}
                                  onChange={(e) => setEditVForm({ ...editVForm, price: Number(e.target.value) })}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                                  Harga Beli Default
                                </label>
                                <input
                                  type="number"
                                  style={{ width: "100%", padding: 6 }}
                                  value={editVForm.default_purchase_price || 0}
                                  onChange={(e) => setEditVForm({ ...editVForm, default_purchase_price: Number(e.target.value) })}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                                  Biaya Operasional/Unit
                                </label>
                                <input
                                  type="number"
                                  style={{ width: "100%", padding: 6 }}
                                  value={editVForm.default_operational_cost_unit || 0}
                                  onChange={(e) => setEditVForm({ ...editVForm, default_operational_cost_unit: Number(e.target.value) })}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                                  COGS Saat Ini
                                </label>
                                <input
                                  type="number"
                                  style={{ width: "100%", padding: 6 }}
                                  value={editVForm.cogs_current || 0}
                                  onChange={(e) => setEditVForm({ ...editVForm, cogs_current: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => updateVariant(v.id!)}>Simpan</button>
                              <button onClick={() => { setEditingVariant(null); setEditVForm({}); }}>Batal</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong>{v.sku}</strong> | {v.weight_gram}g | Stok: {v.stock_on_hand} | 
                              Harga: Rp {Number(v.price).toLocaleString("id-ID")} | 
                              COGS: Rp {Number(v.cogs_current).toLocaleString("id-ID")}
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => startEditVariant(v)}>Edit</button>
                              <button
                                onClick={() => deleteVariant(v.id!)}
                                style={{ background: "#dc3545", color: "white" }}
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
