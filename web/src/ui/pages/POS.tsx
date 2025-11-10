import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  photo?: string | null;
};

type Category = {
  id: string;
  name: string;
  description?: string | null;
};

type ProductVariant = {
  id: string;
  sku: string;
  price: string | number;
  stock_on_hand: number;
  images?: string | string[] | null;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  images?: string | string[] | null;
  categoryId?: string | null;
  variants: ProductVariant[];
};

type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantSku: string;
  price: number;
  qty: number;
  image?: string | null;
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
  const { token, user } = useAuth();
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "card">("cash");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [order, setOrder] = useState<any>(null);
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

  async function loadCategories() {
    try {
      const list = await api<Category[]>("/products/categories");
      setCategories(list);
    } catch (e) {
      console.error("Error loading categories:", e);
    }
  }

  async function loadProducts() {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.set("categoryId", selectedCategory);
      }
      const list = await api<Product[]>(`/products/public?${params.toString()}`);
      setProducts(list || []);
    } catch (e) {
      console.error("Error loading products:", e);
    }
  }

  useEffect(() => {
    loadCustomers().catch(() => undefined);
    loadCategories().catch(() => undefined);
  }, []);

  useEffect(() => {
    loadProducts().catch(() => undefined);
  }, [selectedCategory]);

  function addToCart(product: Product, variant: ProductVariant) {
    if (variant.stock_on_hand <= 0) {
      alert("Stok produk habis");
      return;
    }

    const existingItem = cart.find((item) => item.variantId === variant.id);
    if (existingItem) {
      if (existingItem.qty >= variant.stock_on_hand) {
        alert("Stok tidak mencukupi");
        return;
      }
      setCart(
        cart.map((item) =>
          item.variantId === variant.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      const productImage = Array.isArray(product.images) ? product.images[0] : product.images || null;
      const variantImage = Array.isArray(variant.images) ? variant.images[0] : variant.images || null;
      const image = variantImage || productImage || null;

      setCart([
        ...cart,
        {
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          variantSku: variant.sku,
          price: Number(variant.price),
          qty: 1,
          image,
        },
      ]);
    }
  }

  function updateCartQty(variantId: string, newQty: number) {
    if (newQty <= 0) {
      setCart(cart.filter((item) => item.variantId !== variantId));
      return;
    }
    const item = cart.find((item) => item.variantId === variantId);
    if (item) {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === variantId);
      if (variant && newQty > variant.stock_on_hand) {
        alert("Stok tidak mencukupi");
        return;
      }
    }
    setCart(
      cart.map((item) =>
        item.variantId === variantId ? { ...item, qty: newQty } : item
      )
    );
  }

  function removeFromCart(variantId: string) {
    setCart(cart.filter((item) => item.variantId !== variantId));
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;
  const change = paymentMethod === "cash" ? Math.max(0, cashAmount - total) : 0;

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

      await loadCustomers();
      setCustomerId(result.id);
      setShowAddCustomerModal(false);
      setNewCustomerForm({ name: "", phone: "", email: "", photo: "" });
    } catch (e: any) {
      console.error("Error creating customer:", e);
      const errorMsg = e.message || "Terjadi kesalahan saat membuat customer";
      alert(errorMsg);
    }
  }

  async function processPayment() {
    if (!token) {
      alert("Silakan login terlebih dahulu sebagai staff/admin");
      return;
    }
    if (user && user.role !== "admin" && user.role !== "staff") {
      alert("Anda tidak memiliki akses untuk membuat order. Hanya staff/admin yang dapat mengakses POS.");
      return;
    }
    if (cart.length === 0) {
      alert("Keranjang kosong");
      return;
    }
    if (paymentMethod === "cash" && cashAmount < total) {
      alert("Jumlah uang tunai kurang");
      return;
    }

    try {
      const items = cart.map((item) => ({
        variantId: item.variantId,
        qty: item.qty,
      }));

      const payload: any = {
        items,
      };
      
      // Only include customerId if it's not empty
      if (customerId && customerId.trim() !== "") {
        payload.customerId = customerId;
      }

      console.log("Sending POS order:", payload);

      const res = await api<any>(`/pos/orders`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setOrder(res);
      printReceipt(res);
      // Reset cart and form
      setCart([]);
      setCustomerId("");
      setDiscountPercent(0);
      setCashAmount(0);
      setPaymentMethod("cash");
      // Reload products to update stock
      await loadProducts();
    } catch (e: any) {
      console.error("Error creating order:", e);
      let errorMessage = "Terjadi kesalahan saat membuat order";
      
      if (e.message) {
        try {
          const errorObj = typeof e.message === "string" ? JSON.parse(e.message) : e.message;
          if (errorObj.error) {
            errorMessage = typeof errorObj.error === "string" ? errorObj.error : JSON.stringify(errorObj.error);
          } else if (errorObj.message) {
            errorMessage = errorObj.message;
          }
        } catch {
          errorMessage = e.message;
        }
      }
      
      alert(`Error: ${errorMessage}`);
    }
  }

  function printReceipt(orderData: any) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup diblokir. Silakan izinkan popup untuk mencetak struk.");
      return;
    }

    const receiptContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Struk Pembayaran</title>
  <style>
    @media print {
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; padding: 10px; font-size: 12px; }
    }
    body {
      font-family: monospace;
      width: 80mm;
      margin: 0 auto;
      padding: 10px;
      font-size: 12px;
    }
    .header { text-align: center; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 16px; }
    .header p { margin: 5px 0; }
    .divider { border-top: 1px dashed #000; margin: 10px 0; }
    .item { margin: 5px 0; }
    .item-name { font-weight: bold; }
    .item-detail { font-size: 10px; color: #666; }
    .right { text-align: right; }
    .total { font-weight: bold; font-size: 14px; margin-top: 10px; }
    .footer { text-align: center; margin-top: 20px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>GEMALERY</h1>
    <p>Struk Pembayaran</p>
    <p>${new Date().toLocaleString("id-ID")}</p>
  </div>
  <div class="divider"></div>
  ${cart
    .map(
      (item) => `
    <div class="item">
      <div class="item-name">${item.productName}</div>
      <div class="item-detail">${item.qty} x ${Number(item.price).toLocaleString("id-ID")}</div>
      <div class="right">${(item.price * item.qty).toLocaleString("id-ID")}</div>
    </div>
  `
    )
    .join("")}
  <div class="divider"></div>
  <div class="right">
    <div>Subtotal: ${subtotal.toLocaleString("id-ID")}</div>
    ${discountPercent > 0 ? `<div>Diskon (${discountPercent}%): -${discountAmount.toLocaleString("id-ID")}</div>` : ""}
    <div class="total">Total: ${total.toLocaleString("id-ID")}</div>
    ${paymentMethod === "cash" ? `<div>Tunai: ${cashAmount.toLocaleString("id-ID")}</div><div>Kembalian: ${change.toLocaleString("id-ID")}</div>` : `<div>Metode: ${paymentMethod.toUpperCase()}</div>`}
  </div>
  <div class="divider"></div>
  <div class="footer">
    <p>Terima kasih atas kunjungan Anda</p>
    <p>Order ID: ${orderData.id}</p>
  </div>
</body>
</html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6", display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          {!token || !user ? (
            <div style={{ padding: 8, backgroundColor: "#fff3cd", border: "1px solid #ffc107", borderRadius: 4, fontSize: "0.9em" }}>
              <strong>⚠️ Belum Login</strong> - Silakan login terlebih dahulu
            </div>
          ) : user.role !== "admin" && user.role !== "staff" ? (
            <div style={{ padding: 8, backgroundColor: "#f8d7da", border: "1px solid #dc3545", borderRadius: 4, fontSize: "0.9em" }}>
              <strong>❌ Akses Ditolak</strong> - Hanya staff/admin
            </div>
          ) : (
            <div style={{ padding: 8, backgroundColor: "#d4edda", border: "1px solid #28a745", borderRadius: 4, fontSize: "0.9em" }}>
              <strong>✓ Login:</strong> {user.name || user.email} ({user.role}) | <strong>Token JWT:</strong> Terisi otomatis
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 400 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "bold", fontSize: "0.9em" }}>
              Customer
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={{ width: "100%", padding: 6, fontSize: "0.9em" }}
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
              padding: "6px 12px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: "0.9em",
              alignSelf: "flex-end",
            }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Column - Categories */}
        <div style={{ width: 250, backgroundColor: "#f8f9fa", borderRight: "1px solid #dee2e6", overflowY: "auto", padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: "1.1em" }}>Kategori</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: "10px 12px",
                textAlign: "left",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                backgroundColor: selectedCategory === null ? "#007bff" : "#e9ecef",
                color: selectedCategory === null ? "white" : "#212529",
                fontWeight: selectedCategory === null ? "bold" : "normal",
              }}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  backgroundColor: selectedCategory === cat.id ? "#007bff" : "#e9ecef",
                  color: selectedCategory === cat.id ? "white" : "#212529",
                  fontWeight: selectedCategory === cat.id ? "bold" : "normal",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Center Column - Products */}
        <div style={{ flex: 1, padding: 16, overflowY: "auto", backgroundColor: "#ffffff" }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Produk</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
            {products.map((product) =>
              product.variants.map((variant) => {
                const productImage = Array.isArray(product.images) ? product.images[0] : product.images || null;
                const variantImage = Array.isArray(variant.images) ? variant.images[0] : variant.images || null;
                const image = variantImage || productImage;

                return (
                  <div
                    key={variant.id}
                    onClick={() => addToCart(product, variant)}
                    style={{
                      border: "1px solid #dee2e6",
                      borderRadius: 8,
                      padding: 12,
                      cursor: variant.stock_on_hand > 0 ? "pointer" : "not-allowed",
                      opacity: variant.stock_on_hand > 0 ? 1 : 0.5,
                      backgroundColor: variant.stock_on_hand > 0 ? "white" : "#f8f9fa",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (variant.stock_on_hand > 0) {
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 4, marginBottom: 8 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: 120,
                          backgroundColor: "#e9ecef",
                          borderRadius: 4,
                          marginBottom: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6c757d",
                        }}
                      >
                        No Image
                      </div>
                    )}
                    <div style={{ fontSize: "0.9em", fontWeight: "bold", marginBottom: 4 }}>{product.name}</div>
                    <div style={{ fontSize: "0.85em", color: "#6c757d", marginBottom: 4 }}>SKU: {variant.sku}</div>
                    <div style={{ fontSize: "1em", fontWeight: "bold", color: "#28a745", marginBottom: 4 }}>
                      Rp {Number(variant.price).toLocaleString("id-ID")}
                    </div>
                    <div style={{ fontSize: "0.8em", color: variant.stock_on_hand > 0 ? "#28a745" : "#dc3545" }}>
                      Stok: {variant.stock_on_hand}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {products.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#6c757d" }}>Tidak ada produk</div>
          )}
        </div>

        {/* Right Column - Cart */}
        <div style={{ width: 400, backgroundColor: "#f8f9fa", borderLeft: "1px solid #dee2e6", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: 16, borderBottom: "1px solid #dee2e6" }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Daftar Pesanan</h3>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#6c757d" }}>Keranjang kosong</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {cart.map((item) => (
                  <div key={item.variantId} style={{ backgroundColor: "white", padding: 12, borderRadius: 8, border: "1px solid #dee2e6" }}>
                    <div style={{ fontWeight: "bold", marginBottom: 4 }}>{item.productName}</div>
                    <div style={{ fontSize: "0.85em", color: "#6c757d", marginBottom: 8 }}>SKU: {item.variantSku}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <button
                        onClick={() => updateCartQty(item.variantId, item.qty - 1)}
                        style={{
                          width: 28,
                          height: 28,
                          border: "1px solid #dee2e6",
                          borderRadius: 4,
                          backgroundColor: "white",
                          cursor: "pointer",
                          fontSize: "1.2em",
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: 40, textAlign: "center" }}>{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.variantId, item.qty + 1)}
                        style={{
                          width: 28,
                          height: 28,
                          border: "1px solid #dee2e6",
                          borderRadius: 4,
                          backgroundColor: "white",
                          cursor: "pointer",
                          fontSize: "1.2em",
                        }}
                      >
                        +
                      </button>
                      <div style={{ marginLeft: "auto", fontWeight: "bold" }}>
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      style={{
                        width: "100%",
                        padding: "4px 8px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: "0.85em",
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: 16, borderTop: "1px solid #dee2e6", backgroundColor: "white" }}>
            <div style={{ borderTop: "1px solid #dee2e6", paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: "bold" }}>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="number"
                  placeholder="Diskon %"
                  value={discountPercent || ""}
                  onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                  min="0"
                  max="100"
                  style={{ flex: 1, padding: 8, border: "1px solid #dee2e6", borderRadius: 4 }}
                />
              </div>
              {discountPercent > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#dc3545" }}>
                  <span>Diskon ({discountPercent}%):</span>
                  <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div style={{ borderTop: "1px solid #dee2e6", paddingTop: 12, marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: "1.2em" }}>
                  <span style={{ fontWeight: "bold" }}>Total:</span>
                  <span style={{ fontWeight: "bold", color: "#28a745" }}>Rp {total.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Metode Pembayaran</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      style={{
                        flex: 1,
                        padding: 8,
                        border: "1px solid #dee2e6",
                        borderRadius: 4,
                        backgroundColor: paymentMethod === "cash" ? "#007bff" : "white",
                        color: paymentMethod === "cash" ? "white" : "#212529",
                        cursor: "pointer",
                      }}
                    >
                      Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod("qris")}
                      style={{
                        flex: 1,
                        padding: 8,
                        border: "1px solid #dee2e6",
                        borderRadius: 4,
                        backgroundColor: paymentMethod === "qris" ? "#007bff" : "white",
                        color: paymentMethod === "qris" ? "white" : "#212529",
                        cursor: "pointer",
                      }}
                    >
                      QRIS
                    </button>
                    <button
                      onClick={() => setPaymentMethod("card")}
                      style={{
                        flex: 1,
                        padding: 8,
                        border: "1px solid #dee2e6",
                        borderRadius: 4,
                        backgroundColor: paymentMethod === "card" ? "#007bff" : "white",
                        color: paymentMethod === "card" ? "white" : "#212529",
                        cursor: "pointer",
                      }}
                    >
                      Kartu
                    </button>
                  </div>
                </div>
                {paymentMethod === "cash" && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Jumlah Uang</label>
                    <input
                      type="number"
                      value={cashAmount || ""}
                      onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                      min={total}
                      style={{ width: "100%", padding: 8, border: "1px solid #dee2e6", borderRadius: 4 }}
                    />
                    {cashAmount >= total && (
                      <div style={{ marginTop: 8, padding: 8, backgroundColor: "#d4edda", borderRadius: 4 }}>
                        <strong>Kembalian:</strong> Rp {change.toLocaleString("id-ID")}
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={processPayment}
                  disabled={cart.length === 0 || (paymentMethod === "cash" && cashAmount < total)}
                  style={{
                    width: "100%",
                    padding: 12,
                    backgroundColor: cart.length === 0 || (paymentMethod === "cash" && cashAmount < total) ? "#6c757d" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: cart.length === 0 || (paymentMethod === "cash" && cashAmount < total) ? "not-allowed" : "pointer",
                    fontSize: "1.1em",
                    fontWeight: "bold",
                  }}
                >
                  {paymentMethod === "cash" ? "Proses Pembayaran" : "Sudah Dibayar"}
                </button>
              </div>
            </div>
          </div>
        </div>
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
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Foto Customer</label>
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
