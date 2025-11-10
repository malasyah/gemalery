import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";

type Category = {
  id: string;
  name: string;
  description?: string | null;
  operationalCostComponents?: Array<{
    id: string;
    name: string;
    cost: string | number;
  }>;
  _count?: {
    products: number;
  };
};

export function Categories(): React.JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [costComponents, setCostComponents] = useState<Array<{ id?: string; name: string; cost: number }>>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  async function load() {
    try {
      const list = await api<Category[]>("/categories");
      setCategories(list);
    } catch (e) {
      console.error("Error loading categories:", e);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createCategory() {
    if (!form.name.trim()) {
      alert("Nama kategori wajib diisi");
      return;
    }

    try {
      const category = await api<Category>("/categories", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
        }),
      });

      // Create operational cost components if any
      const validComponents = costComponents.filter((comp) => comp.name.trim() && comp.cost > 0);
      if (validComponents.length > 0) {
        await Promise.all(
          validComponents.map((comp) =>
            api(`/categories/${category.id}/operational-cost-components`, {
              method: "POST",
              body: JSON.stringify({
                name: comp.name.trim(),
                cost: comp.cost,
              }),
            })
          )
        );
      }

      setForm({ name: "", description: "" });
      setCostComponents([{ name: "", cost: 0 }]);
      await load();
    } catch (e: any) {
      console.error("Error creating category:", e);
      let errorMsg = "Terjadi kesalahan saat membuat kategori";
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

  function startEdit(category: Category) {
    try {
      setEditingId(category.id);
      setEditForm({
        name: category.name,
        description: category.description || "",
      });
      setEditingCategoryId(category.id);
      setCostComponents(
        category.operationalCostComponents?.map((comp) => ({
          id: comp.id,
          name: comp.name,
          cost: Number(comp.cost),
        })) || [{ name: "", cost: 0 }]
      );
    } catch (error: any) {
      console.error("Error starting edit category:", error);
      alert("Terjadi kesalahan saat memuat data kategori untuk diedit. Silakan coba lagi.");
    }
  }

  async function updateCategory(categoryId: string) {
    if (!editForm.name.trim()) {
      alert("Nama kategori wajib diisi");
      return;
    }

    try {
      await api(`/categories/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
        }),
      });

      // Update operational cost components
      const existingComponents = categories.find((c) => c.id === categoryId)?.operationalCostComponents || [];
      const validComponents = costComponents.filter((comp) => comp.name.trim() && comp.cost > 0);

      // Delete components that are no longer in the list
      const componentsToDelete = existingComponents.filter(
        (existing) => !validComponents.find((v) => v.id === existing.id)
      );
      await Promise.all(
        componentsToDelete.map((comp) =>
          api(`/categories/operational-cost-components/${comp.id}`, {
            method: "DELETE",
          })
        )
      );

      // Create new components and update existing ones
      for (const comp of validComponents) {
        if (comp.id) {
          // Update existing
          await api(`/categories/operational-cost-components/${comp.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: comp.name.trim(),
              cost: comp.cost,
            }),
          });
        } else {
          // Create new
          await api(`/categories/${categoryId}/operational-cost-components`, {
            method: "POST",
            body: JSON.stringify({
              name: comp.name.trim(),
              cost: comp.cost,
            }),
          });
        }
      }

      setEditingId(null);
      setEditForm({ name: "", description: "" });
      setCostComponents([{ name: "", cost: 0 }]);
      setEditingCategoryId(null);
      await load();
    } catch (e: any) {
      console.error("Error updating category:", e);
      let errorMsg = "Terjadi kesalahan saat memperbarui kategori";
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

  async function deleteCategory(categoryId: string) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const productCount = category._count?.products || 0;
    if (productCount > 0) {
      alert(`Tidak dapat menghapus kategori ini karena masih memiliki ${productCount} produk. Hapus atau pindahkan produk terlebih dahulu.`);
      return;
    }

    if (!confirm(`Yakin ingin menghapus kategori "${category.name}"?`)) return;

    try {
      await api(`/categories/${categoryId}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      console.error("Error deleting category:", e);
      let errorMsg = "Terjadi kesalahan saat menghapus kategori";
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

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", description: "" });
    setCostComponents([{ name: "", cost: 0 }]);
    setEditingCategoryId(null);
  }

  return (
    <div>
      <h2>Category Management</h2>

      {/* Create Category Form */}
      <div style={{ border: "1px solid #ddd", padding: 16, marginBottom: 24, borderRadius: 8 }}>
        <h3>Buat Kategori Baru</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Nama Kategori <span style={{ color: "red" }}>*</span>
            </label>
            <input
              style={{ width: "100%", padding: 8 }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masukkan nama kategori"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Deskripsi Kategori
            </label>
            <input
              style={{ width: "100%", padding: 8 }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Masukkan deskripsi kategori (opsional)"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Komponen Biaya Operasional
            </label>
            {costComponents.map((comp, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input
                  style={{ flex: 1, padding: 8 }}
                  value={comp.name}
                  onChange={(e) => {
                    const updated = [...costComponents];
                    updated[idx].name = e.target.value;
                    setCostComponents(updated);
                  }}
                  placeholder="Keterangan biaya"
                />
                <input
                  type="number"
                  style={{ width: 150, padding: 8 }}
                  value={comp.cost || ""}
                  onChange={(e) => {
                    const updated = [...costComponents];
                    updated[idx].cost = Number(e.target.value) || 0;
                    setCostComponents(updated);
                  }}
                  placeholder="Harga"
                />
                {costComponents.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCostComponents(costComponents.filter((_, i) => i !== idx));
                    }}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCostComponents([...costComponents, { name: "", cost: 0 }])}
              style={{
                padding: "6px 12px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.9em",
              }}
            >
              + Tambah Komponen
            </button>
            <div style={{ marginTop: 8, padding: 8, backgroundColor: "#e7f3ff", borderRadius: 4, fontSize: "0.9em" }}>
              <strong>Total Biaya Operasional:</strong> Rp{" "}
              {costComponents.reduce((sum, comp) => sum + (comp.cost || 0), 0).toLocaleString("id-ID")}
            </div>
          </div>
        </div>
        <button
          onClick={createCategory}
          style={{
            marginTop: 12,
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Simpan Kategori
        </button>
      </div>

      {/* Category List */}
      <div>
        <h3>Daftar Kategori ({categories.length})</h3>
        {categories.length === 0 ? (
          <p>Tidak ada kategori. Silakan buat kategori baru.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {categories.map((cat) => (
              <div key={cat.id} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
                {editingId === cat.id ? (
                  <div>
                    <h4 style={{ marginTop: 0 }}>Edit Kategori</h4>
                    <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                          Nama <span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                          style={{ width: "100%", padding: 8 }}
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                          Deskripsi
                        </label>
                        <input
                          style={{ width: "100%", padding: 8 }}
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                          Komponen Biaya Operasional
                        </label>
                        {costComponents.map((comp, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                            <input
                              style={{ flex: 1, padding: 8 }}
                              value={comp.name}
                              onChange={(e) => {
                                const updated = [...costComponents];
                                updated[idx].name = e.target.value;
                                setCostComponents(updated);
                              }}
                              placeholder="Keterangan biaya"
                            />
                            <input
                              type="number"
                              style={{ width: 150, padding: 8 }}
                              value={comp.cost || ""}
                              onChange={(e) => {
                                const updated = [...costComponents];
                                updated[idx].cost = Number(e.target.value) || 0;
                                setCostComponents(updated);
                              }}
                              placeholder="Harga"
                            />
                            {costComponents.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCostComponents(costComponents.filter((_, i) => i !== idx));
                                }}
                                style={{
                                  padding: "8px 12px",
                                  backgroundColor: "#dc3545",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                }}
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setCostComponents([...costComponents, { name: "", cost: 0 }])}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: "0.9em",
                          }}
                        >
                          + Tambah Komponen
                        </button>
                        <div style={{ marginTop: 8, padding: 8, backgroundColor: "#e7f3ff", borderRadius: 4, fontSize: "0.9em" }}>
                          <strong>Total Biaya Operasional:</strong> Rp{" "}
                          {costComponents.reduce((sum, comp) => sum + (comp.cost || 0), 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => updateCategory(cat.id)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Simpan
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <h4 style={{ marginTop: 0, marginBottom: 4 }}>{cat.name}</h4>
                        {cat.description && (
                          <p style={{ margin: 0, color: "#666", fontSize: "0.9em" }}>{cat.description}</p>
                        )}
                        <div style={{ marginTop: 8, fontSize: "0.9em" }}>
                          <strong>Total Biaya Operasional:</strong> Rp{" "}
                          {(cat.operationalCostComponents?.reduce((sum, comp) => sum + Number(comp.cost), 0) || 0).toLocaleString("id-ID")}
                        </div>
                        {cat.operationalCostComponents && cat.operationalCostComponents.length > 0 && (
                          <div style={{ marginTop: 8, fontSize: "0.85em", color: "#666" }}>
                            <strong>Komponen:</strong>
                            <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
                              {cat.operationalCostComponents.map((comp, idx) => (
                                <li key={idx}>
                                  {comp.name}: Rp {Number(comp.cost).toLocaleString("id-ID")}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div style={{ marginTop: 8, fontSize: "0.85em", color: "#666" }}>
                          <strong>Jumlah Produk:</strong> {cat._count?.products || 0}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => startEdit(cat)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: "0.9em",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: "0.9em",
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

