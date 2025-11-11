import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Product = { id: string; name: string; description?: string; images?: string[] | null; categoryId?: string | null; category?: Category | null };
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

type Category = {
  id: string;
  name: string;
  description?: string | null;
};

export function Archive(): React.JSX.Element {
  const [products, setProducts] = useState<(Product & { variants: Variant[] })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");

  async function load() {
    const url = "/products?archived=true";
    const list = await api<(Product & { variants: Variant[] })[]>(url);
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

  async function loadCategories() {
    try {
      const list = await api<Category[]>("/categories");
      setCategories(list);
    } catch (e) {
      console.error("Error loading categories:", e);
    }
  }

  useEffect(() => { 
    load().catch(() => undefined);
    loadCategories().catch(() => undefined);
  }, []);

  // Filter and search functions
  function filterProducts() {
    let filtered = [...products];

    // Filter by category if selected
    if (selectedCategoryFilter) {
      filtered = filtered.filter(p => p.categoryId === selectedCategoryFilter);
    }

    // Filter by search query (nama produk atau nama variant/SKU)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        // Search in product name
        if (p.name.toLowerCase().includes(query)) return true;
        // Search in variants (SKU, barcode)
        return p.variants.some(v => 
          v.sku.toLowerCase().includes(query) ||
          (v.barcode && v.barcode.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }

  async function unarchiveProduct(productId: string) {
    try {
      await api(`/products/${productId}/unarchive`, { method: "PATCH" });
      await load();
    } catch (e: any) {
      console.error("Error unarchiving product:", e);
      let errorMsg = "Terjadi kesalahan saat mengaktifkan kembali produk";
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

  const displayedProducts = filterProducts();

  return (
    <div>
      <h2>Archive - Produk yang Diarsip</h2>
      
      {/* Search Bar */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Cari produk berdasarkan nama produk atau nama variant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: "1em",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
          Filter Kategori:
        </label>
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "8px 12px",
            fontSize: "1em",
            border: "1px solid #ddd",
            borderRadius: 4,
          }}
        >
          <option value="">-- Semua Kategori --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product List */}
      <div style={{ marginTop: 16 }}>
        {displayedProducts.length === 0 ? (
          <p>Tidak ada produk yang diarsip.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {displayedProducts.map((p) => (
              <div key={p.id} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, backgroundColor: "white" }}>
                {/* Product Header with Image and Name */}
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  {/* Main Product Image */}
                  <div style={{ flexShrink: 0 }}>
                    {p.images && Array.isArray(p.images) && p.images.length > 0 ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        style={{
                          width: 120,
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "2px solid #6c757d",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 120,
                          height: 120,
                          backgroundColor: "#f0f0f0",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#999",
                          fontSize: "0.9em",
                        }}
                      >
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Product Name and Actions */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.3em", fontWeight: "bold" }}>{p.name}</h3>
                        {p.description && (
                          <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "0.9em" }}>{p.description}</p>
                        )}
                        {p.category && (
                          <span style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", backgroundColor: "#e7f3ff", borderRadius: 4, fontSize: "0.85em", color: "#0066cc" }}>
                            {p.category.name}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => unarchiveProduct(p.id)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: "0.9em",
                          }}
                          title="Aktifkan Kembali"
                        >
                          ♻️ Aktifkan Kembali
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variants List */}
                <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
                  <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: "1.1em" }}>Variants ({p.variants.length})</h4>
                  <div style={{ display: "grid", gap: 12 }}>
                    {p.variants.map((v) => (
                      <div
                        key={v.id}
                        style={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 6,
                          padding: 12,
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          {/* Variant Image */}
                          <div style={{ flexShrink: 0 }}>
                            {v.images && Array.isArray(v.images) && v.images.length > 0 ? (
                              <img
                                src={v.images[0]}
                                alt={v.sku}
                                style={{
                                  width: 80,
                                  height: 80,
                                  objectFit: "cover",
                                  borderRadius: 6,
                                  border: "1px solid #ddd",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 80,
                                  height: 80,
                                  backgroundColor: "#f0f0f0",
                                  borderRadius: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#999",
                                  fontSize: "0.8em",
                                }}
                              >
                                No Image
                              </div>
                            )}
                          </div>

                          {/* Variant Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div>
                                <strong style={{ fontSize: "1em" }}>{v.sku}</strong>
                                {v.barcode && (
                                  <span style={{ marginLeft: 8, color: "#666", fontSize: "0.9em" }}>Barcode: {v.barcode}</span>
                                )}
                                <div style={{ marginTop: 4, fontSize: "0.85em", color: "#666" }}>
                                  Berat: {v.weight_gram}g | Stok: {v.stock_on_hand} | Harga: Rp {Number(v.price).toLocaleString("id-ID")}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

