import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Address = {
  id: string;
  label?: string;
  recipient_name: string;
  recipient_phone: string;
  address_line: string;
  province?: string;
  city?: string;
  subdistrict?: string;
  postal_code?: string;
  is_default: boolean;
};

export function AddressBook(): React.JSX.Element {
  const [customerId, setCustomerId] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<Partial<Address>>({ recipient_name: "", recipient_phone: "", address_line: "" });

  async function load() {
    if (!customerId) return;
    const data = await api<Address[]>(`/users/${customerId}/addresses`);
    setAddresses(data);
  }

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function addAddress() {
    if (!customerId) return;
    await api(`/users/${customerId}/addresses`, { method: "POST", body: JSON.stringify(form) });
    setForm({ recipient_name: "", recipient_phone: "", address_line: "" });
    await load();
  }

  async function setDefault(id: string) {
    await api(`/users/${customerId}/addresses/${id}/default`, { method: "POST" });
    await load();
  }

  async function remove(id: string) {
    await api(`/users/${customerId}/addresses/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <h2>Address Book</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input placeholder="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <button onClick={load}>Load</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <h3>Tambah Alamat</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <input placeholder="Recipient Name" value={form.recipient_name || ""} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
          <input placeholder="Recipient Phone" value={form.recipient_phone || ""} onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} />
          <input placeholder="Address Line" value={form.address_line || ""} onChange={(e) => setForm({ ...form, address_line: e.target.value })} />
          <input placeholder="City" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={Boolean(form.is_default)} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} /> Default
          </label>
        </div>
        <button style={{ marginTop: 8 }} onClick={addAddress}>Simpan Alamat</button>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Daftar Alamat</h3>
        {addresses.map((a) => (
          <div key={a.id} style={{ border: "1px solid #ddd", padding: 8, marginBottom: 8 }}>
            <div><strong>{a.recipient_name}</strong> ({a.recipient_phone})</div>
            <div>{a.address_line}{a.city ? `, ${a.city}` : ""}</div>
            <div>Default: {a.is_default ? "Yes" : "No"}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {!a.is_default && <button onClick={() => setDefault(a.id)}>Set Default</button>}
              <button onClick={() => remove(a.id)}>Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


