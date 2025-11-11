import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../lib/api.js";

type User = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  photo?: string | null;
  role: "admin" | "staff" | "customer";
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    addresses: number;
  };
};

type Order = {
  id: string;
  status: string;
  subtotal: string;
  discount_total: string;
  shipping_cost: string;
  createdAt: string;
  items: Array<{
    id: string;
    qty: number;
    price: string;
    productVariant: {
      sku: string;
      product: {
        id: string;
        name: string;
        images: string[] | null;
      };
    };
  }>;
  channel: {
    name: string;
    key: string;
  };
  payments: Array<{
    method: string;
    amount: string;
    status: string;
  }>;
  shipments: Array<{
    tracking_number: string | null;
    status: string;
  }>;
};

export function Users(): React.JSX.Element {
  const location = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", role: "staff" as "admin" | "staff" | "customer" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: "", password: "", name: "", phone: "", role: "staff" as "admin" | "staff" | "customer" });
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [viewingOrdersUserId, setViewingOrdersUserId] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [viewingAddressesUserId, setViewingAddressesUserId] = useState<string | null>(null);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);

  async function load() {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      if (roleFilter) {
        params.append("role", roleFilter);
      }
      const queryString = params.toString();
      const url = `/users${queryString ? `?${queryString}` : ""}`;
      const list = await api<User[]>(url);
      setUsers(list);
    } catch (e: any) {
      console.error("Error loading users:", e);
      alert("Error loading users: " + (e.message || String(e)));
    }
  }

  // Reset form when component mounts or route changes
  useEffect(() => {
    setForm({ email: "", password: "", name: "", phone: "", role: "staff" });
    setEditingId(null);
    setEditForm({ email: "", password: "", name: "", phone: "", role: "staff" });
    setShowNewUserModal(false);
    load().catch(() => undefined);
  }, [location.pathname]);

  // Reload when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      load().catch(() => undefined);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, roleFilter]);

  async function createUser() {
    if (!form.email.trim()) {
      alert("Email wajib diisi");
      return;
    }

    if (!form.password.trim()) {
      alert("Password wajib diisi");
      return;
    }

    if (form.password.length < 6) {
      alert("Password minimal 6 karakter");
      return;
    }

    try {
      const payload: any = {
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      };
      
      if (form.name.trim()) payload.name = form.name.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();
      
      await api<any>("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      setForm({ email: "", password: "", name: "", phone: "", role: "staff" });
      setShowNewUserModal(false);
      await load();
      alert("User berhasil dibuat");
    } catch (e: any) {
      console.error("Error creating user:", e);
      let errorMsg = "Terjadi kesalahan saat membuat user";
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

  function startEdit(user: User) {
    setEditingId(user.id);
    setEditForm({
      email: user.email,
      password: "",
      name: user.name || "",
      phone: user.phone || "",
      role: user.role,
    });
  }

  async function updateUser(userId: string) {
    if (!editForm.email.trim()) {
      alert("Email wajib diisi");
      return;
    }

    try {
      const payload: any = {
        email: editForm.email.trim(),
        role: editForm.role,
      };
      
      if (editForm.name.trim()) {
        payload.name = editForm.name.trim();
      } else {
        payload.name = null;
      }
      
      if (editForm.phone.trim()) {
        payload.phone = editForm.phone.trim();
      } else {
        payload.phone = null;
      }
      
      if (editForm.password.trim()) {
        if (editForm.password.length < 6) {
          alert("Password minimal 6 karakter");
          return;
        }
        payload.password = editForm.password;
      }
      
      await api(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setEditingId(null);
      setEditForm({ email: "", password: "", name: "", phone: "", role: "staff" });
      await load();
      alert("User berhasil diperbarui");
    } catch (e: any) {
      let errorMsg = "Terjadi kesalahan saat memperbarui user";
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

  async function deleteUser(userId: string) {
    if (!confirm("Yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.")) return;

    try {
      await api(`/users/${userId}`, { method: "DELETE" });
      await load();
      alert("User berhasil dihapus");
    } catch (e: any) {
      let errorMsg = "Terjadi kesalahan saat menghapus user";
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

  async function viewUserOrders(userId: string) {
    try {
      const orders = await api<Order[]>(`/users/${userId}/orders`);
      setUserOrders(orders);
      setViewingOrdersUserId(userId);
    } catch (e: any) {
      console.error("Error loading user orders:", e);
      alert("Error loading orders: " + (e.message || String(e)));
    }
  }

  async function viewUserAddresses(userId: string) {
    try {
      const addresses = await api<any[]>(`/users/${userId}/addresses`);
      setUserAddresses(addresses);
      setViewingAddressesUserId(userId);
    } catch (e: any) {
      console.error("Error loading user addresses:", e);
      alert("Error loading addresses: " + (e.message || String(e)));
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "admin":
        return { backgroundColor: "#dc2626", color: "white" };
      case "staff":
        return { backgroundColor: "#2563eb", color: "white" };
      case "customer":
        return { backgroundColor: "#16a34a", color: "white" };
      default:
        return { backgroundColor: "#6b7280", color: "white" };
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>User Management</h2>

      {/* Search and Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Cari nama, email, atau no telpon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 4, minWidth: 150 }}
        >
          <option value="">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="customer">Customer</option>
        </select>
        <button
          onClick={() => setShowNewUserModal(true)}
          style={{
            padding: "10px 16px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          title="Tambah User / New User"
        >
          ➕
        </button>
      </div>

      {/* New User Modal */}
      {showNewUserModal && (
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
          onClick={() => setShowNewUserModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 8,
              maxWidth: 500,
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Buat User Baru</h3>
            <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); createUser(); }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                    Email <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="email"
                    autoComplete="off"
                    style={{ width: "100%", padding: 8 }}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                    Password <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    style={{ width: "100%", padding: 8 }}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Nama</label>
                  <input
                    type="text"
                    autoComplete="off"
                    style={{ width: "100%", padding: 8 }}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nama lengkap (opsional)"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>No Telpon</label>
                  <input
                    type="tel"
                    autoComplete="off"
                    style={{ width: "100%", padding: 8 }}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="No telpon (opsional)"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                    Role <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    style={{ width: "100%", padding: 8 }}
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "staff" | "customer" })}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div style={{ display: "grid", gap: 16 }}>
        {users.map((user) => {
          const isEditing = editingId === user.id;
          return (
            <div
              key={user.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              {/* User Photo */}
              <div>
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt={user.name || user.email}
                    style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      backgroundColor: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    👤
                  </div>
                )}
              </div>

              {/* User Info */}
              <div style={{ flex: 1 }}>
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      type="email"
                      style={{ padding: 6, border: "1px solid #ddd", borderRadius: 4 }}
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email"
                    />
                    <input
                      type="text"
                      style={{ padding: 6, border: "1px solid #ddd", borderRadius: 4 }}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Nama"
                    />
                    <input
                      type="tel"
                      style={{ padding: 6, border: "1px solid #ddd", borderRadius: 4 }}
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="No Telpon"
                    />
                    <select
                      style={{ padding: 6, border: "1px solid #ddd", borderRadius: 4 }}
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as "admin" | "staff" | "customer" })}
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="customer">Customer</option>
                    </select>
                    <input
                      type="password"
                      style={{ padding: 6, border: "1px solid #ddd", borderRadius: 4 }}
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Password baru (kosongkan jika tidak diubah)"
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => updateUser(user.id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({ email: "", password: "", name: "", phone: "", role: "staff" });
                        }}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#6b7280",
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
                  <>
                    <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                      {user.name || user.email}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: 4 }}>
                      {user.email}
                    </div>
                    {user.phone && (
                      <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: 4 }}>
                        {user.phone}
                      </div>
                    )}
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        display: "inline-block",
                        ...getRoleBadgeColor(user.role),
                      }}
                    >
                      {user.role.toUpperCase()}
                    </span>
                    {user._count && (
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>
                        {user._count.orders} orders • {user._count.addresses} addresses
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              {!isEditing && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => viewUserAddresses(user.id)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "1.2rem",
                    }}
                    title="View Addresses"
                  >
                    📍
                  </button>
                  <button
                    onClick={() => viewUserOrders(user.id)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "1.2rem",
                    }}
                    title="View Orders"
                  >
                    🛒
                  </button>
                  <button
                    onClick={() => startEdit(user)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "1.2rem",
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#fee2e2",
                      border: "1px solid #fca5a5",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "1.2rem",
                    }}
                    title="Block User"
                  >
                    🚫
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {users.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
            Belum ada user
          </div>
        )}
      </div>

      {/* Orders Modal */}
      {viewingOrdersUserId && (
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
          onClick={() => {
            setViewingOrdersUserId(null);
            setUserOrders([]);
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 8,
              maxWidth: 800,
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Order History</h3>
            {userOrders.length === 0 ? (
              <p>No orders found</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {userOrders.map((order) => (
                  <div key={order.id} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <strong>Order ID:</strong> {order.id}
                      </div>
                      <div>
                        <strong>Status:</strong> {order.status}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Channel:</strong> {order.channel.name}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Items:</strong>
                      <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.productVariant.product.name} ({item.productVariant.sku}) - Qty: {item.qty} × Rp {Number(item.price).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #eee" }}>
                      <div><strong>Subtotal:</strong> Rp {Number(order.subtotal).toLocaleString()}</div>
                      <div><strong>Discount:</strong> Rp {Number(order.discount_total).toLocaleString()}</div>
                      <div><strong>Shipping:</strong> Rp {Number(order.shipping_cost).toLocaleString()}</div>
                      <div style={{ marginTop: 4, fontWeight: "bold" }}>
                        <strong>Total:</strong> Rp {(Number(order.subtotal) - Number(order.discount_total) + Number(order.shipping_cost)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                setViewingOrdersUserId(null);
                setUserOrders([]);
              }}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Addresses Modal */}
      {viewingAddressesUserId && (
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
          onClick={() => {
            setViewingAddressesUserId(null);
            setUserAddresses([]);
          }}
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
            <h3 style={{ marginTop: 0 }}>Addresses</h3>
            {userAddresses.length === 0 ? (
              <p>No addresses found</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {userAddresses.map((addr) => (
                  <div key={addr.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 4 }}>
                    {addr.is_default && (
                      <span style={{ backgroundColor: "#16a34a", color: "white", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", marginBottom: 8, display: "inline-block" }}>
                        DEFAULT
                      </span>
                    )}
                    <div><strong>{addr.recipient_name}</strong></div>
                    <div>{addr.recipient_phone}</div>
                    <div>{addr.address_line}</div>
                    {addr.city && <div>{addr.city}, {addr.province}</div>}
                    {addr.postal_code && <div>Postal Code: {addr.postal_code}</div>}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                setViewingAddressesUserId(null);
                setUserAddresses([]);
              }}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
