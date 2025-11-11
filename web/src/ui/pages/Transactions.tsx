import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  date: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function Transactions(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<"out" | "in">("out");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    category: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0], // Default to today
    notes: "",
  });

  async function load() {
    try {
      const type = activeTab === "out" ? "EXPENSE" : "INCOME";
      const list = await api<Transaction[]>(`/transactions?type=${type}`);
      setTransactions(list || []);
    } catch (e) {
      console.error("Error loading transactions:", e);
      setTransactions([]);
    }
  }

  useEffect(() => {
    load();
  }, [activeTab]);

  function resetForm() {
    setForm({
      type: activeTab === "out" ? "EXPENSE" : "INCOME",
      category: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setEditingTransaction(null);
  }

  async function createTransaction() {
    if (!form.category.trim()) {
      alert("Keterangan wajib diisi");
      return;
    }
    if (!form.amount || form.amount <= 0) {
      alert("Jumlah transaksi wajib diisi dan harus lebih dari 0");
      return;
    }

    try {
      await api("/transactions", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          type: activeTab === "out" ? "EXPENSE" : "INCOME",
        }),
      });
      resetForm();
      await load();
    } catch (e: any) {
      console.error("Error creating transaction:", e);
      let errorMsg = "Terjadi kesalahan saat membuat transaksi";
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

  async function updateTransaction() {
    if (!editingTransaction) return;
    if (!form.category.trim()) {
      alert("Keterangan wajib diisi");
      return;
    }
    if (!form.amount || form.amount <= 0) {
      alert("Jumlah transaksi wajib diisi dan harus lebih dari 0");
      return;
    }

    try {
      await api(`/transactions/${editingTransaction}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      resetForm();
      await load();
    } catch (e: any) {
      console.error("Error updating transaction:", e);
      let errorMsg = "Terjadi kesalahan saat memperbarui transaksi";
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

  async function deleteTransaction(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;

    try {
      await api(`/transactions/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      console.error("Error deleting transaction:", e);
      let errorMsg = "Terjadi kesalahan saat menghapus transaksi";
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

  function startEdit(t: Transaction) {
    setEditingTransaction(t.id);
    setForm({
      type: t.type,
      category: t.category,
      amount: Number(t.amount),
      date: new Date(t.date).toISOString().split("T")[0],
      notes: t.notes || "",
    });
  }

  return (
    <div>
      <h2>Transaksi</h2>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "2px solid #eee" }}>
        <button
          onClick={() => {
            setActiveTab("out");
            resetForm();
          }}
          style={{
            padding: "12px 24px",
            border: "none",
            background: activeTab === "out" ? "#dc3545" : "transparent",
            color: activeTab === "out" ? "white" : "#666",
            cursor: "pointer",
            borderBottom: activeTab === "out" ? "2px solid #dc3545" : "2px solid transparent",
            marginBottom: "-2px",
            fontWeight: activeTab === "out" ? "bold" : "normal",
          }}
        >
          Transaksi Keluar
        </button>
        <button
          onClick={() => {
            setActiveTab("in");
            resetForm();
          }}
          style={{
            padding: "12px 24px",
            border: "none",
            background: activeTab === "in" ? "#28a745" : "transparent",
            color: activeTab === "in" ? "white" : "#666",
            cursor: "pointer",
            borderBottom: activeTab === "in" ? "2px solid #28a745" : "2px solid transparent",
            marginBottom: "-2px",
            fontWeight: activeTab === "in" ? "bold" : "normal",
          }}
        >
          Transaksi Masuk
        </button>
      </div>

      {/* Form */}
      <div style={{ border: "1px solid #ddd", padding: 16, marginBottom: 24, borderRadius: 8, backgroundColor: "#f9f9f9" }}>
        <h3 style={{ marginTop: 0 }}>
          {editingTransaction ? "Edit Transaksi" : `Tambah Transaksi ${activeTab === "out" ? "Keluar" : "Masuk"}`}
        </h3>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Tanggal <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="date"
              style={{ width: "100%", padding: 8 }}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Keterangan <span style={{ color: "red" }}>*</span>
            </label>
            <input
              style={{ width: "100%", padding: 8 }}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Masukkan keterangan transaksi"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Jumlah Transaksi <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="number"
              style={{ width: "100%", padding: 8 }}
              value={form.amount || ""}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
              Catatan (Opsional)
            </label>
            <textarea
              style={{ width: "100%", padding: 8, minHeight: 80 }}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Masukkan catatan tambahan (opsional)"
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={editingTransaction ? updateTransaction : createTransaction}
              style={{
                padding: "10px 20px",
                backgroundColor: activeTab === "out" ? "#dc3545" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {editingTransaction ? "Simpan Perubahan" : "Simpan"}
            </button>
            {editingTransaction && (
              <button
                onClick={resetForm}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div>
        <h3>Daftar Transaksi {activeTab === "out" ? "Keluar" : "Masuk"}</h3>
        {transactions.length === 0 ? (
          <p>Tidak ada transaksi.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {transactions.map((t) => (
              <div
                key={t.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>{t.category}</div>
                    <div
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: "0.85em",
                        backgroundColor: t.type === "INCOME" ? "#d4edda" : "#f8d7da",
                        color: t.type === "INCOME" ? "#155724" : "#721c24",
                      }}
                    >
                      {t.type === "INCOME" ? "Masuk" : "Keluar"}
                    </div>
                  </div>
                  <div style={{ color: "#666", fontSize: "0.9em", marginBottom: 4 }}>
                    Tanggal: {new Date(t.date).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div style={{ fontSize: "1.2em", fontWeight: "bold", color: t.type === "INCOME" ? "#28a745" : "#dc3545" }}>
                    {t.type === "INCOME" ? "+" : "-"} Rp {Number(t.amount).toLocaleString("id-ID")}
                  </div>
                  {t.notes && (
                    <div style={{ marginTop: 8, color: "#666", fontSize: "0.9em" }}>
                      Catatan: {t.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => startEdit(t)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "0.9em",
                    }}
                    title="Edit"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "0.9em",
                    }}
                    title="Delete"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

