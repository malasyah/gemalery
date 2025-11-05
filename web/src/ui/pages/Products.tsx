import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Product = { id: string; name: string; description?: string; images?: string[] | null };
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
  images?: string[] | null;
};

type VariantForm = Omit<Variant, "id" | "productId">;

export function Products(): React.JSX.Element {
  const [products, setProducts] = useState<(Product & { variants: Variant[] })[]>([]);
  const [pForm, setPForm] = useState({ name: "", description: "", images: [] as string[] });
  const [productVariants, setProductVariants] = useState<VariantForm[]>([]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editPForm, setEditPForm] = useState({ name: "", description: "", images: [] as string[] });
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
    images: [],
  });
  const [addingVariantToProduct, setAddingVariantToProduct] = useState<string | null>(null);
  const [variantFormForExisting, setVariantFormForExisting] = useState<VariantForm>({
    sku: "",
    barcode: "",
    weight_gram: 0,
    stock_on_hand: 0,
    price: 0,
    default_purchase_price: 0,
    default_operational_cost_unit: 0,
    cogs_current: 0,
    images: [],
  });

  async function load() {
    const list = await api<(Product & { variants: Variant[] })[]>("/products");
    // Normalize images to array format
    const normalized = list.map(p => ({
      ...p,
      images: p.images ? (Array.isArray(p.images) ? p.images : [p.images]) : null,
      variants: p.variants.map(v => ({
        ...v,
        images: v.images ? (Array.isArray(v.images) ? v.images : [v.images]) : null,
      })),
    }));
    setProducts(normalized);
  }
  useEffect(() => { load().catch(() => undefined); }, []);

  // Helper function to convert file to base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Helper function to handle file selection
  async function handleFileSelect(files: FileList | null, callback: (url: string) => void) {
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        alert(`File "${file.name}" bukan gambar. Hanya file gambar yang diizinkan.`);
        continue;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" terlalu besar. Maksimal 5MB.`);
        continue;
      }
      
      try {
        const base64 = await fileToBase64(file);
        callback(base64);
      } catch (error) {
        console.error("Error converting file to base64:", error);
        alert(`Error saat memproses file "${file.name}"`);
      }
    }
  }

  // Helper functions for images
  function addProductImage(url: string) {
    if (!url.trim()) return;
    setPForm({ ...pForm, images: [...pForm.images, url.trim()] });
  }

  function removeProductImage(index: number) {
    setPForm({ ...pForm, images: pForm.images.filter((_, i) => i !== index) });
  }

  function addEditProductImage(url: string) {
    if (!url.trim()) return;
    setEditPForm({ ...editPForm, images: [...editPForm.images, url.trim()] });
  }

  function removeEditProductImage(index: number) {
    setEditPForm({ ...editPForm, images: editPForm.images.filter((_, i) => i !== index) });
  }

  function addVariantImage(url: string) {
    if (!url.trim()) return;
    setVariantForm({ ...variantForm, images: [...(variantForm.images || []), url.trim()] });
  }

  function removeVariantImage(index: number) {
    setVariantForm({ ...variantForm, images: (variantForm.images || []).filter((_, i) => i !== index) });
  }

  function addVariantImageForExisting(url: string) {
    if (!url.trim()) return;
    setVariantFormForExisting({ ...variantFormForExisting, images: [...(variantFormForExisting.images || []), url.trim()] });
  }

  function removeVariantImageForExisting(index: number) {
    setVariantFormForExisting({ ...variantFormForExisting, images: (variantFormForExisting.images || []).filter((_, i) => i !== index) });
  }

  function updateVariantImageInProduct(index: number, imageIndex: number, url: string) {
    const updated = [...productVariants];
    const images = updated[index].images || [];
    images[imageIndex] = url.trim();
    updated[index].images = images;
    setProductVariants(updated);
  }

  function removeVariantImageInProduct(variantIndex: number, imageIndex: number) {
    const updated = [...productVariants];
    updated[variantIndex].images = (updated[variantIndex].images || []).filter((_, i) => i !== imageIndex);
    setProductVariants(updated);
  }

  function addVariantImageInProduct(variantIndex: number, url: string) {
    if (!url.trim()) return;
    const updated = [...productVariants];
    updated[variantIndex].images = [...(updated[variantIndex].images || []), url.trim()];
    setProductVariants(updated);
  }

  function addEditVariantImage(url: string) {
    if (!url.trim()) return;
    const images = editVForm.images || [];
    setEditVForm({ ...editVForm, images: [...images, url.trim()] });
  }

  function removeEditVariantImage(index: number) {
    const images = editVForm.images || [];
    setEditVForm({ ...editVForm, images: images.filter((_, i) => i !== index) });
  }

  function addVariantToProduct() {
    if (!variantForm.sku || !variantForm.sku.trim()) {
      alert("SKU wajib diisi");
      return;
    }
    
    const skuTrimmed = variantForm.sku.trim();
    const skuLower = skuTrimmed.toLowerCase();
    
    // Check for duplicate SKU in current product variants (case-insensitive)
    const duplicate = productVariants.find(v => v.sku && v.sku.trim().toLowerCase() === skuLower);
    if (duplicate) {
      alert(`SKU "${skuTrimmed}" sudah ada dalam daftar variant (SKU "${duplicate.sku}"). SKU tidak boleh sama meskipun huruf kapital/kecil berbeda. Setiap variant harus memiliki SKU yang unik.`);
      return;
    }
    
    setProductVariants([...productVariants, { ...variantForm, sku: skuTrimmed }]);
    setVariantForm({
      sku: "",
      barcode: "",
      weight_gram: 0,
      stock_on_hand: 0,
      price: 0,
      default_purchase_price: 0,
      default_operational_cost_unit: 0,
      cogs_current: 0,
      images: [],
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
      const payload = {
        name: pForm.name,
        description: pForm.description,
        images: pForm.images.length > 0 ? pForm.images : null,
        variants: productVariants.map(v => ({
          ...v,
          images: v.images && v.images.length > 0 ? v.images : null,
        })),
      };
      
      console.log("Creating product with payload:", payload);
      
      const result = await api("/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      console.log("Product created:", result);
      
      setPForm({ name: "", description: "", images: [] });
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
        images: [],
      });
      await load();
    } catch (e: any) {
      console.error("Error creating product:", e);
      // Try to parse error message from response
      let errorMsg = "Terjadi kesalahan saat membuat produk";
      try {
        const errorText = e.message || String(e);
        const errorObj = JSON.parse(errorText);
        errorMsg = errorObj.error || errorMsg;
      } catch {
        errorMsg = e.message || String(e) || errorMsg;
      }
      alert(errorMsg);
    }
  }

  async function updateProduct(productId: string) {
    if (!editPForm.name) return;
    const payload = {
      ...editPForm,
      images: editPForm.images.length > 0 ? editPForm.images : null,
    };
    await api(`/products/${productId}`, { method: "PATCH", body: JSON.stringify(payload) });
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

  function startAddVariant(productId: string) {
    setAddingVariantToProduct(productId);
    setVariantFormForExisting({
      sku: "",
      barcode: "",
      weight_gram: 0,
      stock_on_hand: 0,
      price: 0,
      default_purchase_price: 0,
      default_operational_cost_unit: 0,
      cogs_current: 0,
      images: [],
    });
  }

  async function createVariant(productId: string) {
    if (!variantFormForExisting.sku || !variantFormForExisting.sku.trim()) {
      alert("SKU wajib diisi");
      return;
    }
    
    // Check for duplicate SKU in existing product variants (client-side validation, case-insensitive)
    const product = products.find(p => p.id === productId);
    if (product) {
      const skuTrimmed = variantFormForExisting.sku.trim();
      const skuLower = skuTrimmed.toLowerCase();
      const duplicate = product.variants.find(v => v.sku && v.sku.trim().toLowerCase() === skuLower);
      if (duplicate) {
        alert(`SKU "${skuTrimmed}" sudah ada dalam produk ini (SKU "${duplicate.sku}"). SKU tidak boleh sama meskipun huruf kapital/kecil berbeda. Setiap variant harus memiliki SKU yang unik.`);
        return;
      }
    }
    
    try {
      const payload = {
        ...variantFormForExisting,
        images: variantFormForExisting.images && variantFormForExisting.images.length > 0 ? variantFormForExisting.images : null,
      };
      await api(`/products/${productId}/variants`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setVariantFormForExisting({
        sku: "",
        barcode: "",
        weight_gram: 0,
        stock_on_hand: 0,
        price: 0,
        default_purchase_price: 0,
        default_operational_cost_unit: 0,
        cogs_current: 0,
        images: [],
      });
      setAddingVariantToProduct(null);
      await load();
    } catch (e: any) {
      // Try to parse error message from response
      let errorMsg = "Terjadi kesalahan saat menambahkan variant";
      try {
        const errorText = e.message || String(e);
        const errorObj = JSON.parse(errorText);
        errorMsg = errorObj.error || errorMsg;
      } catch {
        errorMsg = e.message || String(e) || errorMsg;
      }
      alert(errorMsg);
    }
  }

  async function updateVariant(variantId: string) {
    if (!editVForm.sku || !editVForm.sku.trim()) {
      alert("SKU wajib diisi");
      return;
    }
    
    try {
      const payload = {
        ...editVForm,
        images: editVForm.images && editVForm.images.length > 0 ? editVForm.images : null,
      };
      await api(`/products/variants/${variantId}`, { method: "PATCH", body: JSON.stringify(payload) });
      setEditingVariant(null);
      setEditVForm({});
      await load();
    } catch (e: any) {
      // Try to parse error message from response
      let errorMsg = "Terjadi kesalahan saat memperbarui variant";
      try {
        const errorText = e.message || String(e);
        const errorObj = JSON.parse(errorText);
        errorMsg = errorObj.error || errorMsg;
      } catch {
        errorMsg = e.message || String(e) || errorMsg;
      }
      alert(errorMsg);
    }
  }

  async function deleteVariant(variantId: string) {
    if (!confirm("Delete this variant?")) return;
    await api(`/products/variants/${variantId}`, { method: "DELETE" });
    await load();
  }

  function startEditProduct(p: Product) {
    setEditingProduct(p.id);
    const images = p.images ? (Array.isArray(p.images) ? p.images : [p.images]) : [];
    setEditPForm({ name: p.name, description: p.description || "", images });
  }

  function startEditVariant(v: Variant) {
    setEditingVariant(v.id!);
    const images = v.images ? (Array.isArray(v.images) ? v.images : [v.images]) : [];
    setEditVForm({ ...v, images });
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
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Gambar Produk
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                handleFileSelect(e.target.files, addProductImage);
                // Reset input so same file can be selected again
                e.target.value = "";
              }}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />
            <p style={{ fontSize: "0.85em", color: "#666", marginBottom: 8 }}>
              Pilih satu atau lebih gambar dari device Anda (maksimal 5MB per file)
            </p>
            {pForm.images.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {pForm.images.map((url, idx) => (
                  <div key={idx} style={{ position: "relative", border: "1px solid #ddd", borderRadius: 4, overflow: "hidden" }}>
                    <img src={url} alt={`Product ${idx + 1}`} style={{ width: 100, height: 100, objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeProductImage(idx)}
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                  Gambar Variant
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    handleFileSelect(e.target.files, addVariantImage);
                    e.target.value = "";
                  }}
                  style={{ width: "100%", padding: 6, marginBottom: 8 }}
                />
                <p style={{ fontSize: "0.75em", color: "#666", marginBottom: 8 }}>
                  Pilih gambar dari device (maksimal 5MB per file)
                </p>
                {(variantForm.images || []).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {variantForm.images?.map((url, idx) => (
                      <div key={idx} style={{ position: "relative", border: "1px solid #ddd", borderRadius: 4, overflow: "hidden" }}>
                        <img src={url} alt={`Variant ${idx + 1}`} style={{ width: 80, height: 80, objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(idx)}
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: 20,
                            height: 20,
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                      Gambar Produk
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        handleFileSelect(e.target.files, addEditProductImage);
                        e.target.value = "";
                      }}
                      style={{ width: "100%", padding: 8, marginBottom: 8 }}
                    />
                    <p style={{ fontSize: "0.85em", color: "#666", marginBottom: 8 }}>
                      Pilih gambar dari device Anda (maksimal 5MB per file)
                    </p>
                    {editPForm.images.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {editPForm.images.map((url, idx) => (
                          <div key={idx} style={{ position: "relative", border: "1px solid #ddd", borderRadius: 4, overflow: "hidden" }}>
                            <img src={url} alt={`Product ${idx + 1}`} style={{ width: 100, height: 100, objectFit: "cover" }} />
                            <button
                              type="button"
                              onClick={() => removeEditProductImage(idx)}
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                background: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: 24,
                                height: 24,
                                cursor: "pointer",
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => updateProduct(p.id)}>Simpan</button>
                    <button onClick={() => setEditingProduct(null)}>Batal</button>
                  </div>
                </div>
              ) : (
                <div>
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
                  {/* Product Images Display */}
                  {p.images && Array.isArray(p.images) && p.images.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {p.images.map((img, idx) => (
                          <div key={idx} style={{ border: "1px solid #ddd", borderRadius: 4, overflow: "hidden", width: 100, height: 100 }}>
                            <img src={img} alt={`${p.name} ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Variants List */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <strong>Variants ({p.variants.length})</strong>
                  {!editingProduct && !addingVariantToProduct && (
                    <button onClick={() => startAddVariant(p.id)} style={{ fontSize: "0.9em", padding: "4px 8px" }}>
                      + Tambah Variant Baru
                    </button>
                  )}
                </div>
                
                {/* Form untuk tambah variant ke produk yang sudah ada */}
                {addingVariantToProduct === p.id && (
                  <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 4, marginBottom: 12, backgroundColor: "#f0f8ff" }}>
                    <h5 style={{ marginTop: 0, marginBottom: 12 }}>Tambah Variant Baru</h5>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 8 }}>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                          SKU <span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                          style={{ width: "100%", padding: 6 }}
                          value={variantFormForExisting.sku}
                          onChange={(e) => setVariantFormForExisting({ ...variantFormForExisting, sku: e.target.value })}
                          placeholder="Kode SKU"
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>Barcode</label>
                        <input
                          style={{ width: "100%", padding: 6 }}
                          value={variantFormForExisting.barcode}
                          onChange={(e) => setVariantFormForExisting({ ...variantFormForExisting, barcode: e.target.value })}
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
                          value={variantFormForExisting.weight_gram}
                          onChange={(e) => setVariantFormForExisting({ ...variantFormForExisting, weight_gram: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                          Stok <span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                          type="number"
                          style={{ width: "100%", padding: 6 }}
                          value={variantFormForExisting.stock_on_hand}
                          onChange={(e) => setVariantFormForExisting({ ...variantFormForExisting, stock_on_hand: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                          Harga Jual <span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                          type="number"
                          style={{ width: "100%", padding: 6 }}
                          value={variantFormForExisting.price}
                          onChange={(e) => setVariantFormForExisting({ ...variantFormForExisting, price: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                          Harga Beli Default
                        </label>
                        <input
                          type="number"
                          style={{ width: "100%", padding: 6 }}
                          value={variantFormForExisting.default_purchase_price}
                          onChange={(e) => setVariantFormForExisting({ ...variantFormForExisting, default_purchase_price: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                          Biaya Operasional/Unit
                        </label>
                        <input
                          type="number"
                          style={{ width: "100%", padding: 6 }}
                          value={variantFormForExisting.default_operational_cost_unit}
                          onChange={(e) => setVariantFormForExisting({ ...variantFormForExisting, default_operational_cost_unit: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>COGS Saat Ini</label>
                        <input
                          type="number"
                          style={{ width: "100%", padding: 6 }}
                          value={variantFormForExisting.cogs_current}
                          onChange={(e) => setVariantFormForExisting({ ...variantFormForExisting, cogs_current: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                        Gambar Variant
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          handleFileSelect(e.target.files, addVariantImageForExisting);
                          e.target.value = "";
                        }}
                        style={{ width: "100%", padding: 6, marginBottom: 8 }}
                      />
                      <p style={{ fontSize: "0.75em", color: "#666", marginBottom: 8 }}>
                        Pilih gambar dari device (maksimal 5MB per file)
                      </p>
                      {(variantFormForExisting.images || []).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {variantFormForExisting.images?.map((url, idx) => (
                            <div key={idx} style={{ position: "relative", border: "1px solid #ddd", borderRadius: 4, overflow: "hidden" }}>
                              <img src={url} alt={`Variant ${idx + 1}`} style={{ width: 80, height: 80, objectFit: "cover" }} />
                              <button
                                type="button"
                                onClick={() => removeVariantImageForExisting(idx)}
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  background: "#dc3545",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: 20,
                                  height: 20,
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => createVariant(p.id)} style={{ padding: "6px 12px", backgroundColor: "#28a745", color: "white" }}>
                        Simpan Variant
                      </button>
                      <button onClick={() => setAddingVariantToProduct(null)} style={{ padding: "6px 12px" }}>
                        Batal
                      </button>
                    </div>
                  </div>
                )}
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
                            <div style={{ marginTop: 8, marginBottom: 8 }}>
                              <label style={{ display: "block", marginBottom: 4, fontSize: "0.9em" }}>
                                Gambar Variant
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  handleFileSelect(e.target.files, addEditVariantImage);
                                  e.target.value = "";
                                }}
                                style={{ width: "100%", padding: 6, marginBottom: 8 }}
                              />
                              <p style={{ fontSize: "0.75em", color: "#666", marginBottom: 8 }}>
                                Pilih gambar dari device (maksimal 5MB per file)
                              </p>
                              {(editVForm.images || []).length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                  {editVForm.images?.map((url, idx) => (
                                    <div key={idx} style={{ position: "relative", border: "1px solid #ddd", borderRadius: 4, overflow: "hidden" }}>
                                      <img src={url} alt={`Variant ${idx + 1}`} style={{ width: 80, height: 80, objectFit: "cover" }} />
                                      <button
                                        type="button"
                                        onClick={() => removeEditVariantImage(idx)}
                                        style={{
                                          position: "absolute",
                                          top: 4,
                                          right: 4,
                                          background: "#dc3545",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "50%",
                                          width: 20,
                                          height: 20,
                                          cursor: "pointer",
                                          fontSize: "12px",
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => updateVariant(v.id!)}>Simpan</button>
                              <button onClick={() => { setEditingVariant(null); setEditVForm({}); }}>Batal</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
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
                            {/* Variant Images Display */}
                            {v.images && Array.isArray(v.images) && v.images.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {v.images.map((img, idx) => (
                                  <div key={idx} style={{ border: "1px solid #ddd", borderRadius: 4, overflow: "hidden", width: 80, height: 80 }}>
                                    <img src={img} alt={`${v.sku} ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  </div>
                                ))}
                              </div>
                            )}
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

