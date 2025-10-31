import React, { useState } from "react";
import { api } from "../../lib/api";

type Line = { variantId: string; qty: number };

export function POS(): React.JSX.Element {
  const [items, setItems] = useState<Line[]>([{ variantId: "", qty: 1 }]);
  const [customerId, setCustomerId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [token, setToken] = useState("");

  function setItem(i: number, field: keyof Line, value: string | number) {
    const copy = items.slice();
    (copy[i] as any)[field] = field === "qty" ? Number(value) : value;
    setItems(copy);
  }
  function addItem() { setItems([...items, { variantId: "", qty: 1 }]); }

  async function createOrder() {
    if (!token) return alert("Login dulu sebagai staff/admin");
    try {
      const res = await api<any>(`/pos/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items, customerId: customerId || undefined })
      });
      setOrder(res);
      setItems([{ variantId: "", qty: 1 }]);
    } catch (e: any) {
      alert("Error: " + (e.message || String(e)));
    }
  }

  return (
    <div>
      <h2>POS (Staff Only)</h2>
      <div style={{ marginBottom: 12 }}>
        <input placeholder="JWT Token (dari /auth/login staff/admin)" value={token} onChange={(e) => setToken(e.target.value)} style={{ width: "100%", maxWidth: 400 }} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <input placeholder="Customer ID (opsional)" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <div>
          <h4>Items</h4>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input placeholder="Variant ID" value={it.variantId} onChange={(e) => setItem(i, "variantId", e.target.value)} />
              <input type="number" placeholder="Qty" value={it.qty} onChange={(e) => setItem(i, "qty", Number(e.target.value))} />
            </div>
          ))}
          <button onClick={addItem}>Tambah Item</button>
        </div>
        <button onClick={createOrder}>Buat Order (Offline)</button>
        {order && (
          <div style={{ marginTop: 12, padding: 8, background: "#e8f5e9", border: "1px solid #4caf50" }}>
            <strong>Order Created:</strong> {order.id}<br />
            <strong>Status:</strong> {order.status}<br />
            <strong>Subtotal:</strong> {Number(order.subtotal).toLocaleString("id-ID")} IDR
          </div>
        )}
      </div>
    </div>
  );
}

