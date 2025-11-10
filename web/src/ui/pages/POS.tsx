import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";

type Line = { variantId: string; qty: number };

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  photo?: string | null;
};

// Helper function to compress image
function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = reject;
      if (typeof e.target?.result === "string") {
        img.src = e.target.result;
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

export function POS(): React.JSX.Element {
  const [items, setItems] = useState<Line[]>([{ variantId: "", qty: 1 }]);
  const [customerId, setCustomerId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [token, setToken] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: "", phone: "", email: "", photo: "" });

  async function loadCustomers() {
    try {
      const list = await api<Customer[]>("/customers");
      setCustomers(list);
    } catch (e) {
      console.error("Error loading customers:", e);
    }
  }

  useEffect(() => {
    loadCustomers().catch(() => undefined);
  }, []);

  function setItem(i: number, field: keyof Line, value: string | number) {
    const copy = items.slice();
    (copy[i] as any)[field] = field === "qty" ? Number(value) : value;
    setItems(copy);
  }
  function addItem() { setItems([...items, { variantId: "", qty: 1 }]); }

  async function createNewCustomer() {
    if (!newCustomerForm.name.trim()) {
      alert("Nama customer wajib diisi");
      return;
    }

    try {
      const payload: any = {
        name: newCustomerForm.name.trim(),
      };
      
      if (newCustomerForm.phone.trim()) payload.phone = newCustomerForm.phone.trim();
      if (newCustomerForm.email.trim()) payload.email = newCustomerForm.email.trim();
      if (newCustomerForm.photo.trim()) payload.photo = newCustomerForm.photo.trim();
      
      const result = await api<Customer>("/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      // Update customers list
      await loadCustomers();
      
      // Set the newly created customer as selected
      setCustomerId(result.id);
      
      // Close modal and reset form
      setShowAddCustomerModal(false);
      setNewCustomerForm({ name: "", phone: "", email: "", photo: "" });
    } catch (e: any) {
      console.error("Error creating customer:", e);
      const errorMsg = e.message || "Terjadi kesalahan saat membuat customer";
      alert(errorMsg);
    }
  }

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
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Customer (opsional)
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            >
              <option value="">-- Pilih Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCustomerModal(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Add New Customer
          </button>
        </div>
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

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowAddCustomerModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 8,
              maxWidth: 600,
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Tambah Customer Baru</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                  Nama Customer <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  style={{ width: "100%", padding: 8 }}
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  placeholder="Masukkan nama customer"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Email</label>
                <input
                  type="email"
                  style={{ width: "100%", padding: 8 }}
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  placeholder="email@example.com (opsional)"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>No. Telepon</label>
                <input
                  style={{ width: "100%", padding: 8 }}
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  placeholder="081234567890 (opsional)"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                  Foto Customer
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    if (!file.type.startsWith("image/")) {
                      alert("File yang dipilih bukan gambar. Hanya file gambar yang diizinkan.");
                      e.target.value = "";
                      return;
                    }
                    
                    if (file.size > 5 * 1024 * 1024) {
                      alert("File terlalu besar. Maksimal 5MB.");
                      e.target.value = "";
                      return;
                    }
                    
                    try {
                      // Compress image first (max 1920px width, 80% quality)
                      const compressedFile = await compressImage(file, 1920, 0.8);
                      const base64 = await fileToBase64(compressedFile);
                      setNewCustomerForm({ ...newCustomerForm, photo: base64 });
                    } catch (error) {
                      console.error("Error processing file:", error);
                      alert("Error saat memproses file");
                    }
                    e.target.value = "";
                  }}
                  style={{ width: "100%", padding: 8, marginBottom: 8 }}
                />
                <p style={{ fontSize: "0.85em", color: "#666", marginBottom: 8 }}>
                  Pilih foto dari device Anda (maksimal 5MB, opsional)
                </p>
                {newCustomerForm.photo && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={newCustomerForm.photo}
                      alt="Preview"
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddCustomerModal(false);
                  setNewCustomerForm({ name: "", phone: "", email: "", photo: "" });
                }}
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
              <button
                type="button"
                onClick={createNewCustomer}
                style={{
                  padding: "8px 16px",
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
          </div>
        </div>
      )}
    </div>
  );
}

