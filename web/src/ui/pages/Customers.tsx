import React, { useState, useEffect } from "react";
import { api } from "../../lib/api.js";

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  photo?: string | null;
  userId?: string | null;
  user?: {
    email: string;
    name: string;
  } | null;
  addresses?: Array<{
    id: string;
    recipient_name: string;
    recipient_phone: string;
    address_line: string;
    is_default: boolean;
  }>;
  _count?: {
    orders: number;
  };
  createdAt: string;
  updatedAt: string;
};

export function Customers(): React.JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", photo: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", photo: "" });

  async function load() {
    const list = await api<Customer[]>("/customers");
    setCustomers(list);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createCustomer() {
    if (!form.name.trim()) {
      alert("Nama customer wajib diisi");
      return;
    }

    try {
      const payload: any = {
        name: form.name.trim(),
      };
      
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.photo.trim()) payload.photo = form.photo.trim();
      
      console.log("Creating customer with payload:", payload);
      
      const result = await api<any>("/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      setForm({ name: "", phone: "", email: "", photo: "" });
      await load();
    } catch (e: any) {
      console.error("Error creating customer:", e);
      const errorMsg = e.message || "Terjadi kesalahan saat membuat customer";
      alert(errorMsg);
    }
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setEditForm({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      photo: customer.photo || "",
    });
  }

  async function updateCustomer(customerId: string) {
    if (!editForm.name.trim()) {
      alert("Nama customer wajib diisi");
      return;
    }

    try {
      const payload: any = {
        name: editForm.name.trim(),
      };
      
      if (editForm.phone.trim()) payload.phone = editForm.phone.trim();
      else payload.phone = null;
      
      if (editForm.email.trim()) payload.email = editForm.email.trim();
      else payload.email = null;
      
      if (editForm.photo.trim()) payload.photo = editForm.photo.trim();
      else payload.photo = null;
      
      await api(`/customers/${customerId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setEditingId(null);
      setEditForm({ name: "", phone: "", email: "", photo: "" });
      await load();
    } catch (e: any) {
      let errorMsg = "Terjadi kesalahan saat memperbarui customer";
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

  async function deleteCustomer(customerId: string) {
    if (!confirm("Yakin ingin menghapus customer ini? Alamat dan data terkait akan tetap tersimpan.")) return;

    try {
      await api(`/customers/${customerId}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      alert("Error: " + (e.message || String(e)));
    }
  }

  return (
    <div>
      <h2>Customer Management</h2>

      {/* Create Customer Form */}
      <div style={{ border: "1px solid #ddd", padding: 16, marginBottom: 24, borderRadius: 8 }}>
        <h3>Buat Customer Baru</h3>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Nama Customer <span style={{ color: "red" }}>*</span>
            </label>
            <input
              style={{ width: "100%", padding: 8 }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masukkan nama customer"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Email</label>
            <input
              type="email"
              style={{ width: "100%", padding: 8 }}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com (opsional)"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>No. Telepon</label>
            <input
              style={{ width: "100%", padding: 8 }}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="081234567890 (opsional)"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Foto Customer (URL)
            </label>
            <input
              type="text"
              style={{ width: "100%", padding: 8 }}
              value={form.photo}
              onChange={(e) => setForm({ ...form, photo: e.target.value })}
              placeholder="https://example.com/photo.jpg (opsional)"
            />
            {form.photo && (
              <div style={{ marginTop: 8 }}>
                <img src={form.photo} alt="Preview" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }} />
              </div>
            )}
          </div>
        </div>
        <button
          onClick={createCustomer}
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
          Simpan Customer
        </button>
      </div>

      {/* Customer List */}
      <div>
        <h3>Daftar Customer ({customers.length})</h3>
        {customers.length === 0 ? (
          <p>Tidak ada customer. Silakan buat customer baru.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {customers.map((c) => (
              <div key={c.id} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
                {editingId === c.id ? (
                  <div>
                    <h4 style={{ marginTop: 0 }}>Edit Customer</h4>
                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, 1fr)", marginBottom: 12 }}>
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
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Email</label>
                        <input
                          type="email"
                          style={{ width: "100%", padding: 8 }}
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>No. Telepon</label>
                        <input
                          style={{ width: "100%", padding: 8 }}
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                          Foto Customer (URL)
                        </label>
                        <input
                          type="text"
                          style={{ width: "100%", padding: 8 }}
                          value={editForm.photo}
                          onChange={(e) => setEditForm({ ...editForm, photo: e.target.value })}
                          placeholder="https://example.com/photo.jpg (opsional)"
                        />
                        {editForm.photo && (
                          <div style={{ marginTop: 8 }}>
                            <img src={editForm.photo} alt="Preview" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => updateCustomer(c.id)} style={{ padding: "8px 16px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 4 }}>
                        Simpan
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ padding: "8px 16px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: 4 }}>
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", backgroundColor: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {c.photo ? (
                            <img src={c.photo} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                          )}
                        </div>
                        <div>
                          <strong style={{ fontSize: "1.2em" }}>{c.name}</strong>
                          {c.user && (
                            <span style={{ color: "#666", marginLeft: 8, fontSize: "0.9em" }}>
                              (User: {c.user.email})
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => startEdit(c)} style={{ padding: "6px 12px", fontSize: "0.9em" }}>
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCustomer(c.id)}
                          style={{ padding: "6px 12px", fontSize: "0.9em", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: 4 }}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, fontSize: "0.9em", color: "#666" }}>
                      {c.email && <div><strong>Email:</strong> {c.email}</div>}
                      {c.phone && <div><strong>Phone:</strong> {c.phone}</div>}
                      <div><strong>Orders:</strong> {c._count?.orders || 0}</div>
                    </div>
                    {c.addresses && c.addresses.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: "0.85em", color: "#666" }}>
                        <strong>Alamat:</strong> {c.addresses[0].recipient_name} - {c.addresses[0].address_line}
                      </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: "0.85em", color: "#999" }}>
                      ID: {c.id}
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

