import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../lib/api.js";

type User = {
  id: string;
  email: string;
  name?: string | null;
  role: "admin" | "staff" | "customer";
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    photo?: string | null;
  } | null;
};

export function Users(): React.JSX.Element {
  const location = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "staff" as "admin" | "staff" | "customer" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: "", password: "", name: "", role: "staff" as "admin" | "staff" | "customer" });

  async function load() {
    try {
      const list = await api<User[]>("/users");
      setUsers(list);
    } catch (e: any) {
      console.error("Error loading users:", e);
      alert("Error loading users: " + (e.message || String(e)));
    }
  }

  // Reset form when component mounts or route changes
  useEffect(() => {
    // Always reset form first, before loading data
    setForm({ email: "", password: "", name: "", role: "staff" });
    setEditingId(null);
    setEditForm({ email: "", password: "", name: "", role: "staff" });
    // Then load users data
    load().catch(() => undefined);
  }, [location.pathname]);

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
      
      await api<any>("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      // Reset form after successful create
      setForm({ email: "", password: "", name: "", role: "staff" });
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
      password: "", // Don't pre-fill password
      name: user.name || "",
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
      
      // Only update password if provided
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
      // Reset edit form and exit edit mode
      setEditingId(null);
      setEditForm({ email: "", password: "", name: "", role: "staff" });
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

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "admin":
        return { backgroundColor: "#dc2626", color: "white" }; // red
      case "staff":
        return { backgroundColor: "#2563eb", color: "white" }; // blue
      case "customer":
        return { backgroundColor: "#16a34a", color: "white" }; // green
      default:
        return { backgroundColor: "#6b7280", color: "white" }; // gray
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>User Management</h2>

      {/* Create User Form */}
      <div key={location.pathname} style={{ border: "1px solid #ddd", padding: 16, marginBottom: 24, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Buat User Baru</h3>
        <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); createUser(); }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Email <span style={{ color: "red" }}>*</span>
            </label>
            <input
              key={`email-${location.pathname}`}
              type="email"
              name="new-user-email"
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
              key={`password-${location.pathname}`}
              type="password"
              name="new-user-password"
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
              key={`name-${location.pathname}`}
              type="text"
              name="new-user-name"
              autoComplete="off"
              style={{ width: "100%", padding: 8 }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama lengkap (opsional)"
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
          <button
            type="submit"
            style={{
              marginTop: 12,
              padding: "10px 20px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Buat User
          </button>
        </form>
      </div>

      {/* Users List */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
        <h3 style={{ margin: 16, marginBottom: 12 }}>Daftar Users</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "1px solid #ddd" }}>Email</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "1px solid #ddd" }}>Nama</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "1px solid #ddd" }}>Role</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "1px solid #ddd" }}>Customer</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "1px solid #ddd" }}>Created</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isEditing = editingId === user.id;
                return (
                  <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12 }}>
                      {isEditing ? (
                        <input
                          type="email"
                          style={{ width: "100%", padding: 6 }}
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      {isEditing ? (
                        <input
                          style={{ width: "100%", padding: 6 }}
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Nama (opsional)"
                        />
                      ) : (
                        user.name || "-"
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      {isEditing ? (
                        <select
                          style={{ width: "100%", padding: 6 }}
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as "admin" | "staff" | "customer" })}
                        >
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                          <option value="customer">Customer</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: "0.875rem",
                            fontWeight: "bold",
                            display: "inline-block",
                            ...getRoleBadgeColor(user.role),
                          }}
                        >
                          {user.role.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      {user.customer ? (
                        <span style={{ fontSize: "0.875rem" }}>{user.customer.name}</span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: 12, fontSize: "0.875rem", color: "#6b7280" }}>
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td style={{ padding: 12 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <input
                              type="password"
                              style={{ width: "100%", padding: 6, marginBottom: 4 }}
                              value={editForm.password}
                              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              placeholder="Password baru (kosongkan jika tidak diubah)"
                            />
                          </div>
                          <button
                            onClick={() => updateUser(user.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#16a34a",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: "0.875rem",
                            }}
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => {
                              // Reset edit form when canceling
                              setEditingId(null);
                              setEditForm({ email: "", password: "", name: "", role: "staff" });
                            }}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#6b7280",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: "0.875rem",
                            }}
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => startEdit(user)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#2563eb",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: "0.875rem",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#dc2626",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: "0.875rem",
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
              Belum ada user
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

