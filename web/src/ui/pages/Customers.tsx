import React, { useState, useEffect } from "react";
import { api } from "../../lib/api.js";

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

type Order = {
  id: string;
  status: string;
  subtotal: number;
  discount_total: number;
  shipping_cost: number;
  fees_total: number;
  createdAt: string;
  channel?: {
    name: string;
    key: string;
  } | null;
  items: Array<{
    id: string;
    qty: number;
    price: number;
    productVariant: {
      sku: string;
      product: {
        id: string;
        name: string;
        images?: string[] | null;
      };
    };
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
  }>;
  shipments?: Array<{
    id: string;
    carrier: string;
    service: string;
    awb?: string | null;
  }>;
};

export function Customers(): React.JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", photo: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", photo: "" });
  const [viewingOrdersCustomerId, setViewingOrdersCustomerId] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  async function load() {
    const list = await api<Customer[]>("/customers");
    setCustomers(list);
  }

  async function loadCustomerOrders(customerId: string) {
    try {
      const orders = await api<Order[]>(`/customers/${customerId}/orders`);
      setCustomerOrders(orders || []);
    } catch (e) {
      console.error("Error loading customer orders:", e);
      setCustomerOrders([]);
    }
  }

  function viewCustomerOrders(customerId: string) {
    setViewingOrdersCustomerId(customerId);
    loadCustomerOrders(customerId);
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
                  setForm({ ...form, photo: base64 });
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
                              const base64 = await fileToBase64(file);
                              setEditForm({ ...editForm, photo: base64 });
                            } catch (error) {
                              console.error("Error converting file to base64:", error);
                              alert("Error saat memproses file");
                            }
                            e.target.value = "";
                          }}
                          style={{ width: "100%", padding: 8, marginBottom: 8 }}
                        />
                        <p style={{ fontSize: "0.85em", color: "#666", marginBottom: 8 }}>
                          Pilih foto dari device Anda (maksimal 5MB, opsional)
                        </p>
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
                        <button
                          onClick={() => viewCustomerOrders(c.id)}
                          style={{ padding: "6px 12px", fontSize: "0.9em", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 4 }}
                        >
                          📋 View Orders
                        </button>
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

      {/* Customer Orders Modal */}
      {viewingOrdersCustomerId && (
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
          onClick={() => {
            setViewingOrdersCustomerId(null);
            setCustomerOrders([]);
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 8,
              maxWidth: 900,
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>
                Data Transaksi Orderan - {customers.find(c => c.id === viewingOrdersCustomerId)?.name}
              </h3>
              <button
                onClick={() => {
                  setViewingOrdersCustomerId(null);
                  setCustomerOrders([]);
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                ✕ Tutup
              </button>
            </div>

            {customerOrders.length === 0 ? (
              <p>Tidak ada order untuk customer ini.</p>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {customerOrders.map((order) => {
                  const total = order.subtotal - order.discount_total + order.shipping_cost;
                  const productImages = order.items.map(item => {
                    const images = item.productVariant.product.images;
                    if (images && Array.isArray(images) && images.length > 0) {
                      return images[0];
                    }
                    return null;
                  }).filter(Boolean);

                  return (
                    <div
                      key={order.id}
                      style={{
                        border: "1px solid #ddd",
                        padding: 16,
                        borderRadius: 8,
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "1.1em", marginBottom: 4 }}>
                            Order #{order.id.slice(-8).toUpperCase()}
                          </div>
                          <div style={{ fontSize: "0.9em", color: "#666", marginBottom: 4 }}>
                            Tanggal: {new Date(order.createdAt).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {order.channel && (
                            <div style={{ fontSize: "0.9em", color: "#666", marginBottom: 4 }}>
                              Channel: {order.channel.name}
                            </div>
                          )}
                          <div
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: 4,
                              fontSize: "0.85em",
                              backgroundColor:
                                order.status === "completed"
                                  ? "#d4edda"
                                  : order.status === "paid"
                                  ? "#d1ecf1"
                                  : order.status === "pending"
                                  ? "#fff3cd"
                                  : "#f8d7da",
                              color:
                                order.status === "completed"
                                  ? "#155724"
                                  : order.status === "paid"
                                  ? "#0c5460"
                                  : order.status === "pending"
                                  ? "#856404"
                                  : "#721c24",
                            }}
                          >
                            {order.status.toUpperCase()}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.2em", fontWeight: "bold", color: "#28a745" }}>
                            Rp {total.toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #ddd" }}>
                        <strong style={{ fontSize: "0.9em" }}>Items ({order.items.length}):</strong>
                        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                          {order.items.map((item) => {
                            const productImages = item.productVariant.product.images;
                            const mainImage = productImages && Array.isArray(productImages) && productImages.length > 0
                              ? productImages[0]
                              : null;

                            return (
                              <div
                                key={item.id}
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  padding: 8,
                                  backgroundColor: "white",
                                  borderRadius: 4,
                                }}
                              >
                                {mainImage ? (
                                  <img
                                    src={mainImage}
                                    alt={item.productVariant.product.name}
                                    style={{
                                      width: 60,
                                      height: 60,
                                      objectFit: "cover",
                                      borderRadius: 4,
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 60,
                                      height: 60,
                                      backgroundColor: "#f0f0f0",
                                      borderRadius: 4,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "0.8em",
                                      color: "#999",
                                    }}
                                  >
                                    No Image
                                  </div>
                                )}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: "bold" }}>
                                    {item.productVariant.product.name}
                                  </div>
                                  <div style={{ fontSize: "0.85em", color: "#666", marginTop: 4 }}>
                                    SKU: {item.productVariant.sku} | Qty: {item.qty} | Harga: Rp {Number(item.price).toLocaleString("id-ID")}
                                  </div>
                                  <div style={{ fontSize: "0.9em", fontWeight: "bold", marginTop: 4, color: "#28a745" }}>
                                    Subtotal: Rp {(item.qty * Number(item.price)).toLocaleString("id-ID")}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #ddd" }}>
                        <div style={{ display: "grid", gap: 4, fontSize: "0.9em" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Subtotal:</span>
                            <span>Rp {Number(order.subtotal).toLocaleString("id-ID")}</span>
                          </div>
                          {order.discount_total > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", color: "#dc3545" }}>
                              <span>Diskon:</span>
                              <span>- Rp {Number(order.discount_total).toLocaleString("id-ID")}</span>
                            </div>
                          )}
                          {order.shipping_cost > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Ongkir:</span>
                              <span>Rp {Number(order.shipping_cost).toLocaleString("id-ID")}</span>
                            </div>
                          )}
                          {order.fees_total > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", color: "#666" }}>
                              <span>Fees:</span>
                              <span>Rp {Number(order.fees_total).toLocaleString("id-ID")}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "1.1em", marginTop: 8, paddingTop: 8, borderTop: "1px solid #ddd" }}>
                            <span>Total:</span>
                            <span style={{ color: "#28a745" }}>Rp {total.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payments */}
                      {order.payments && order.payments.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #ddd" }}>
                          <strong style={{ fontSize: "0.9em" }}>Pembayaran:</strong>
                          <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                            {order.payments.map((payment) => (
                              <div
                                key={payment.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "0.9em",
                                  padding: 8,
                                  backgroundColor: "white",
                                  borderRadius: 4,
                                }}
                              >
                                <span>
                                  {payment.method} - {payment.status}
                                </span>
                                <span>Rp {Number(payment.amount).toLocaleString("id-ID")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Shipments */}
                      {order.shipments && order.shipments.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #ddd" }}>
                          <strong style={{ fontSize: "0.9em" }}>Pengiriman:</strong>
                          <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                            {order.shipments.map((shipment) => (
                              <div
                                key={shipment.id}
                                style={{
                                  fontSize: "0.9em",
                                  padding: 8,
                                  backgroundColor: "white",
                                  borderRadius: 4,
                                }}
                              >
                                {shipment.carrier} {shipment.service}
                                {shipment.awb && <span> - AWB: {shipment.awb}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

