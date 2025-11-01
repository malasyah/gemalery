import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Product = { id: string; name: string; description?: string };
type Variant = {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  weight_gram: number;
  stock_on_hand: number;
  price: number;
  default_purchase_price: number;
  default_operational_cost_unit: number;
  cogs_current: number;
};

export function Products(): React.JSX.Element {
  const [products, setProducts] = useState<(Product & { variants: Variant[] })[]>([]);
  const [pForm, setPForm] = useState({ name: "", description: "" });
  const [vForm, setVForm] = useState<Partial<Variant>>({ productId: "", sku: "", weight_gram: 0, stock_on_hand: 0, price: 0, default_purchase_price: 0, default_operational_cost_unit: 0, cogs_current: 0 });
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editPForm, setEditPForm] = useState({ name: "", description: "" });
  const [editVForm, setEditVForm] = useState<Partial<Variant>>({});

  async function load() {
    const list = await api<(Product & { variants: Variant[] })[]>("/products");
    setProducts(list);
  }
  useEffect(() => { load().catch(() => undefined); }, []);

  async function createProduct() {
    if (!pForm.name) return;
    await api("/products", { method: "POST", body: JSON.stringify(pForm) });
    setPForm({ name: "", description: "" });
    await load();
  }

  async function updateProduct(productId: string) {
    if (!editPForm.name) return;
    await api(`/products/${productId}`, { method: "PATCH", body: JSON.stringify(editPForm) });
    setEditingProduct(null);
    await load();
  }

  async function deleteProduct(productId: string) {
    if (!confirm("Delete this product? All variants will also be deleted.")) return;
    await api(`/products/${productId}`, { method: "DELETE" });
    await load();
  }

  async function createVariant() {
    if (!vForm.productId || !vForm.sku) return;
    const { productId, ...rest } = vForm as any;
    await api(`/products/${productId}/variants`, { method: "POST", body: JSON.stringify(rest) });
    setVForm({ productId: "", sku: "", weight_gram: 0, stock_on_hand: 0, price: 0, default_purchase_price: 0, default_operational_cost_unit: 0, cogs_current: 0 });
    await load();
  }

  async function updateVariant(variantId: string) {
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
    setEditingVariant(v.id);
    setEditVForm({ ...v });
  }

  return (
    <div>
      <h2>Products</h2>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div>
          <h3>Create Product</h3>
          <input placeholder="Name" value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} />
          <input placeholder="Description" value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} />
          <div><button onClick={createProduct}>Create</button></div>
        </div>
        <div>
          <h3>Create Variant</h3>
          <input placeholder="Product ID" value={vForm.productId || ""} onChange={(e) => setVForm({ ...vForm, productId: e.target.value })} />
          <input placeholder="SKU" value={vForm.sku || ""} onChange={(e) => setVForm({ ...vForm, sku: e.target.value })} />
          <input type="number" placeholder="Weight (gram)" value={vForm.weight_gram || 0} onChange={(e) => setVForm({ ...vForm, weight_gram: Number(e.target.value) })} />
          <input type="number" placeholder="Stock On Hand" value={vForm.stock_on_hand || 0} onChange={(e) => setVForm({ ...vForm, stock_on_hand: Number(e.target.value) })} />
          <input type="number" placeholder="Price" value={vForm.price || 0} onChange={(e) => setVForm({ ...vForm, price: Number(e.target.value) })} />
          <input type="number" placeholder="Default Purchase Price" value={vForm.default_purchase_price || 0} onChange={(e) => setVForm({ ...vForm, default_purchase_price: Number(e.target.value) })} />
          <input type="number" placeholder="Default Operational Cost/Unit" value={vForm.default_operational_cost_unit || 0} onChange={(e) => setVForm({ ...vForm, default_operational_cost_unit: Number(e.target.value) })} />
          <input type="number" placeholder="COGS Current" value={vForm.cogs_current || 0} onChange={(e) => setVForm({ ...vForm, cogs_current: Number(e.target.value) })} />
          <div><button onClick={createVariant}>Create Variant</button></div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Product List</h3>
        {products.map((p) => (
          <div key={p.id} style={{ border: "1px solid #ddd", padding: 8, marginBottom: 8 }}>
            {editingProduct === p.id ? (
              <div style={{ marginBottom: 8 }}>
                <input value={editPForm.name} onChange={(e) => setEditPForm({ ...editPForm, name: e.target.value })} />
                <input value={editPForm.description} onChange={(e) => setEditPForm({ ...editPForm, description: e.target.value })} />
                <button onClick={() => updateProduct(p.id)}>Save</button>
                <button onClick={() => setEditingProduct(null)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <div><strong>{p.name}</strong> — {p.description}</div>
                <button onClick={() => startEditProduct(p)}>Edit</button>
                <button onClick={() => deleteProduct(p.id)} style={{ background: "#dc3545", color: "white" }}>Delete</button>
              </div>
            )}
            <div>Variants:</div>
            <ul>
              {p.variants.map((v) => (
                <li key={v.id} style={{ marginBottom: 4 }}>
                  {editingVariant === v.id ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                      <input placeholder="SKU" value={editVForm.sku || ""} onChange={(e) => setEditVForm({ ...editVForm, sku: e.target.value })} style={{ width: 100 }} />
                      <input type="number" placeholder="Weight" value={editVForm.weight_gram || 0} onChange={(e) => setEditVForm({ ...editVForm, weight_gram: Number(e.target.value) })} style={{ width: 80 }} />
                      <input type="number" placeholder="Stock" value={editVForm.stock_on_hand || 0} onChange={(e) => setEditVForm({ ...editVForm, stock_on_hand: Number(e.target.value) })} style={{ width: 80 }} />
                      <input type="number" placeholder="Price" value={editVForm.price || 0} onChange={(e) => setEditVForm({ ...editVForm, price: Number(e.target.value) })} style={{ width: 100 }} />
                      <button onClick={() => updateVariant(v.id)}>Save</button>
                      <button onClick={() => { setEditingVariant(null); setEditVForm({}); }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span>{v.sku} | {v.weight_gram}g | stock {v.stock_on_hand} | price {Number(v.price)} | cogs {Number(v.cogs_current)}</span>
                      <button onClick={() => startEditVariant(v)}>Edit</button>
                      <button onClick={() => deleteVariant(v.id)} style={{ background: "#dc3545", color: "white" }}>Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}


