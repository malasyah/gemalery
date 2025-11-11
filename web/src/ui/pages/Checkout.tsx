import React, { useState } from "react";
import { api } from "../../lib/api";

type Line = { variantId: string; qty: number };

export function Checkout(): React.JSX.Element {
  const [customerId, setCustomerId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [addressId, setAddressId] = useState("");
  const [newAddress, setNewAddress] = useState({ recipient_name: "", recipient_phone: "", address_line: "" });
  const [items, setItems] = useState<Line[]>([{ variantId: "", qty: 1 }]);
  const [quote, setQuote] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);

  function setItem(i: number, field: keyof Line, value: string | number) {
    const copy = items.slice();
    (copy[i] as any)[field] = field === "qty" ? Number(value) : value;
    setItems(copy);
  }
  function addItem() { setItems([...items, { variantId: "", qty: 1 }]); }

  async function price() {
    const res = await api<any>(`/cart/price`, { method: "POST", body: JSON.stringify({ items }) });
    setQuote(res);
  }

  async function doCheckout() {
    const payload: any = { items, shipping: {} };
    if (customerId) payload.userId = customerId;
    else payload.guest = { name: guestName };
    if (addressId) payload.shipping.addressId = addressId;
    else payload.shipping.address = newAddress;
    const res = await api<any>(`/checkout`, { method: "POST", body: JSON.stringify(payload) });
    setOrder(res.order);
    setQuote(res.shipping_quote);
  }

  return (
    <div>
      <h2>Checkout</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <input placeholder="Customer ID (opsional untuk login)" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        {!customerId && (
          <input placeholder="Guest Name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
        )}

        <div style={{ marginTop: 8 }}>
          <h4>Items</h4>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input placeholder="Variant ID" value={it.variantId} onChange={(e) => setItem(i, "variantId", e.target.value)} />
              <input type="number" placeholder="Qty" value={it.qty} onChange={(e) => setItem(i, "qty", Number(e.target.value))} />
            </div>
          ))}
          <button onClick={addItem}>Tambah Item</button>
        </div>

        <div style={{ marginTop: 8 }}>
          <h4>Alamat</h4>
          <input placeholder="Address ID (opsional)" value={addressId} onChange={(e) => setAddressId(e.target.value)} />
          {!addressId && (
            <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 6 }}>
              <input placeholder="Recipient Name" value={newAddress.recipient_name} onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })} />
              <input placeholder="Recipient Phone" value={newAddress.recipient_phone} onChange={(e) => setNewAddress({ ...newAddress, recipient_phone: e.target.value })} />
              <input placeholder="Address Line" value={newAddress.address_line} onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={price}>Hitung Harga</button>
          <button onClick={doCheckout}>Buat Order</button>
        </div>

        {quote && (
          <div style={{ marginTop: 12 }}>
            <strong>Shipping Estimate:</strong> {quote.shipping_quote ? quote.shipping_quote.cost : quote?.services?.[0]?.cost} IDR
          </div>
        )}
        {order && (
          <div style={{ marginTop: 12 }}>
            <strong>Order ID:</strong> {order.id}
          </div>
        )}
      </div>
    </div>
  );
}


