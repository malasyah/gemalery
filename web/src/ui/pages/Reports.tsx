import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../lib/api.js";

type Order = {
  id: string;
  createdAt: string;
  status: string;
  subtotal: string;
  discount_total: string;
  shipping_cost: string;
  fees_total: string;
  shipping_method?: string | null;
  shipping_address_snapshot?: any;
  user?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  channel: {
    id: string;
    name: string;
    key: string;
  };
  items: Array<{
    id: string;
    qty: number;
    price: string;
    cogs_snapshot: string;
    productVariant: {
      id: string;
      sku: string;
      product: {
        id: string;
        name: string;
      };
    };
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: string;
    status: string;
  }>;
};

type ProductSales = {
  variantId: string;
  variantSku: string;
  productName: string;
  variantName: string;
  totalQty: number;
  totalRevenue: number;
  totalCogs: number;
  totalProfit: number;
};

export function Reports(): React.JSX.Element {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-set tab based on route
  useEffect(() => {
    if (location.pathname === "/admin/reports/products") {
      setActiveTab("products");
    } else {
      setActiveTab("orders");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders();
    } else {
      loadProductSales();
    }
  }, [activeTab, dateFilter]);

  async function loadOrders() {
    setLoading(true);
    try {
      const allOrders = await api<Order[]>("/orders");
      let filtered = allOrders;

      // Filter by date
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filterDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);

        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= filterDate && orderDate < nextDay;
        });
      }

      // Filter by search query (item name or customer name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(order => {
          const matchesCustomer = order.user?.name?.toLowerCase().includes(query) ||
                                 order.user?.email?.toLowerCase().includes(query);
          const matchesItem = order.items.some(item =>
            item.productVariant.product.name.toLowerCase().includes(query) ||
            item.productVariant.sku.toLowerCase().includes(query)
          );
          return matchesCustomer || matchesItem;
        });
      }

      setOrders(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e: any) {
      console.error("Error loading orders:", e);
      alert("Error loading orders: " + (e.message || String(e)));
    } finally {
      setLoading(false);
    }
  }

  async function loadProductSales() {
    setLoading(true);
    try {
      const allOrders = await api<Order[]>("/orders");
      
      // Aggregate product sales
      const salesMap = new Map<string, ProductSales>();

      allOrders.forEach(order => {
        order.items.forEach(item => {
          const key = item.productVariant.id;
          const existing = salesMap.get(key);
          const qty = item.qty;
          const price = Number(item.price);
          const revenue = price * qty;
          // Use cogs_snapshot from OrderItem
          const cogsPerUnit = Number(item.cogs_snapshot) || 0;
          const cogs = cogsPerUnit * qty;
          const profit = revenue - cogs;

          if (existing) {
            existing.totalQty += qty;
            existing.totalRevenue += revenue;
            existing.totalCogs += cogs;
            existing.totalProfit += profit;
          } else {
            salesMap.set(key, {
              variantId: item.productVariant.id,
              variantSku: item.productVariant.sku,
              productName: item.productVariant.product.name,
              variantName: item.productVariant.sku, // Using SKU as variant name
              totalQty: qty,
              totalRevenue: revenue,
              totalCogs: cogs,
              totalProfit: profit,
            });
          }
        });
      });

      let sales = Array.from(salesMap.values());

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        sales = sales.filter(s => 
          s.variantSku.toLowerCase().includes(query) ||
          s.productName.toLowerCase().includes(query) ||
          s.variantName.toLowerCase().includes(query)
        );
      }

      setProductSales(sales.sort((a, b) => b.totalRevenue - a.totalRevenue));
    } catch (e: any) {
      console.error("Error loading product sales:", e);
      alert("Error loading product sales: " + (e.message || String(e)));
    } finally {
      setLoading(false);
    }
  }

  const totalOrderAmount = orders.reduce((sum, order) => 
    sum + Number(order.subtotal) - Number(order.discount_total) + Number(order.shipping_cost) + Number(order.fees_total), 
    0
  );

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Reports</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "2px solid #e5e7eb" }}>
        <button
          onClick={() => {
            setActiveTab("orders");
            setSearchQuery("");
            setDateFilter("");
          }}
          style={{
            padding: "12px 24px",
            border: "none",
            backgroundColor: "transparent",
            borderBottom: activeTab === "orders" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "orders" ? "#2563eb" : "#6b7280",
            fontWeight: activeTab === "orders" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          Daftar Orderan
        </button>
        <button
          onClick={() => {
            setActiveTab("products");
            setSearchQuery("");
            setDateFilter("");
          }}
          style={{
            padding: "12px 24px",
            border: "none",
            backgroundColor: "transparent",
            borderBottom: activeTab === "products" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "products" ? "#2563eb" : "#6b7280",
            fontWeight: activeTab === "products" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          Daftar Produk
        </button>
      </div>

      {/* Daftar Orderan */}
      {activeTab === "orders" && (
        <div>
          {/* Search and Date Filter */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Cari berdasarkan item atau nama customer..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setTimeout(() => loadOrders(), 300);
              }}
              style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
              }}
              style={{ padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
          ) : (
            <>
              <div style={{ marginBottom: 16, fontSize: "0.875rem", color: "#6b7280" }}>
                Total: {orders.length} orderan | Total Revenue: Rp {totalOrderAmount.toLocaleString()}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f3f4f6" }}>
                      <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>ID Order</th>
                      <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Tanggal</th>
                      <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Customer</th>
                      <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Channel</th>
                      <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Status</th>
                      <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Shipping</th>
                      <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Payment</th>
                      <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Items</th>
                      <th style={{ padding: 12, textAlign: "right", borderBottom: "2px solid #e5e7eb" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const total = Number(order.subtotal) - Number(order.discount_total) + Number(order.shipping_cost) + Number(order.fees_total);
                      return (
                        <tr key={order.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: 12, fontSize: "0.875rem", fontFamily: "monospace" }}>
                            {order.id.substring(0, 8)}...
                          </td>
                          <td style={{ padding: 12, fontSize: "0.875rem" }}>
                            {new Date(order.createdAt).toLocaleString("id-ID")}
                          </td>
                          <td style={{ padding: 12, fontSize: "0.875rem" }}>
                            {order.user?.name || order.user?.email || "Guest"}
                          </td>
                          <td style={{ padding: 12, fontSize: "0.875rem" }}>
                            {order.channel.name}
                          </td>
                          <td style={{ padding: 12 }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                backgroundColor:
                                  order.status === "paid" || order.status === "completed"
                                    ? "#d1fae5"
                                    : order.status === "pending"
                                    ? "#fef3c7"
                                    : "#fee2e2",
                                color:
                                  order.status === "paid" || order.status === "completed"
                                    ? "#065f46"
                                    : order.status === "pending"
                                    ? "#92400e"
                                    : "#991b1b",
                              }}
                            >
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: 12, fontSize: "0.875rem" }}>
                            {order.shipping_method || "-"}
                            {order.shipping_address_snapshot && (
                              <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 4 }}>
                                {typeof order.shipping_address_snapshot === "object" &&
                                  order.shipping_address_snapshot.recipient_name}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: 12, fontSize: "0.875rem" }}>
                            {order.payments.length > 0 ? (
                              <div>
                                {order.payments.map((p, i) => (
                                  <div key={i} style={{ fontSize: "0.75rem" }}>
                                    {p.method} - {p.status}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td style={{ padding: 12, fontSize: "0.875rem" }}>
                            <div style={{ maxWidth: 300 }}>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: 4, fontSize: "0.75rem" }}>
                                  {item.productVariant.product.name} ({item.productVariant.sku}) - 
                                  Qty: {item.qty} × Rp {Number(item.price).toLocaleString()}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: 12, textAlign: "right", fontWeight: "bold" }}>
                            Rp {total.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {orders.length === 0 && (
                  <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                    Tidak ada orderan ditemukan
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Daftar Produk */}
      {activeTab === "products" && (
        <div>
          {/* Search */}
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Cari berdasarkan nama varian produk..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setTimeout(() => loadProductSales(), 300);
              }}
              style={{ width: "100%", maxWidth: 400, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f3f4f6" }}>
                    <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Nama Varian Produk</th>
                    <th style={{ padding: 12, textAlign: "right", borderBottom: "2px solid #e5e7eb" }}>Jumlah Terjual</th>
                    <th style={{ padding: 12, textAlign: "right", borderBottom: "2px solid #e5e7eb" }}>Total Harga Jual</th>
                    <th style={{ padding: 12, textAlign: "right", borderBottom: "2px solid #e5e7eb" }}>Total Laba/Rugi</th>
                  </tr>
                </thead>
                <tbody>
                  {productSales.map((sale) => (
                    <tr key={sale.variantId} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: "bold" }}>{sale.productName}</div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>SKU: {sale.variantSku}</div>
                      </td>
                      <td style={{ padding: 12, textAlign: "right", fontWeight: "bold" }}>
                        {sale.totalQty}
                      </td>
                      <td style={{ padding: 12, textAlign: "right" }}>
                        Rp {sale.totalRevenue.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: 12,
                          textAlign: "right",
                          fontWeight: "bold",
                          color: sale.totalProfit >= 0 ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {sale.totalProfit >= 0 ? "+" : ""}Rp {sale.totalProfit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {productSales.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: "#f9fafb", fontWeight: "bold" }}>
                      <td style={{ padding: 12 }}>TOTAL</td>
                      <td style={{ padding: 12, textAlign: "right" }}>
                        {productSales.reduce((sum, s) => sum + s.totalQty, 0)}
                      </td>
                      <td style={{ padding: 12, textAlign: "right" }}>
                        Rp {productSales.reduce((sum, s) => sum + s.totalRevenue, 0).toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: 12,
                          textAlign: "right",
                          color:
                            productSales.reduce((sum, s) => sum + s.totalProfit, 0) >= 0
                              ? "#16a34a"
                              : "#dc2626",
                        }}
                      >
                        {productSales.reduce((sum, s) => sum + s.totalProfit, 0) >= 0 ? "+" : ""}
                        Rp {productSales.reduce((sum, s) => sum + s.totalProfit, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {productSales.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                  Tidak ada data produk terjual
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

