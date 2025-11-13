import React, { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.js";
import { AddressBook } from "../pages/AddressBook";
import { Checkout } from "../pages/Checkout";
import { Products } from "../pages/Products";
import { Dashboard } from "../pages/Dashboard";
import { POS } from "../pages/POS";
import { Customers } from "../pages/Customers";
import { Users } from "../pages/Users";
import { Categories } from "../pages/Categories";
import { Archive } from "../pages/Archive";
import { Transactions } from "../pages/Transactions";
import { Reports } from "../pages/Reports";

function AdminProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user is admin or staff
  if (user.role !== "admin" && user.role !== "staff") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function AdminOnlyRoute({ children }: { children: React.ReactElement }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user is admin only
  if (user.role !== "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

type MenuItem = {
  path?: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  submenu?: Array<{ path: string; label: string }>;
};

function SidebarNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(["products", "transactions", "reports"]));

  const isActive = (path: string) => {
    return location.pathname === `/admin${path}` || location.pathname.startsWith(`/admin${path}/`);
  };

  const isParentActive = (submenu?: Array<{ path: string }>) => {
    if (!submenu) return false;
    return submenu.some(item => isActive(item.path));
  };

  const toggleMenu = (menuKey: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuKey)) {
      newExpanded.delete(menuKey);
    } else {
      newExpanded.add(menuKey);
    }
    setExpandedMenus(newExpanded);
  };

  const menuItems: MenuItem[] = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    {
      label: "Products",
      icon: "📦",
      submenu: [
        //{ path: "/products/new", label: "New Product" },
        { path: "/products", label: "Product" },
        { path: "/categories", label: "Categories" },
        { path: "/archive", label: "Archive" },
      ],
    },
    {
      label: "Transaction",
      icon: "💰",
      submenu: [
        { path: "/transactions?type=EXPENSE", label: "Transaksi Keluar" },
        { path: "/transactions?type=INCOME", label: "Transaksi Masuk" },
      ],
    },
    { path: "/users", label: "User", icon: "👤", adminOnly: true },
    { path: "/pos", label: "POS", icon: "💳" },
    {
      label: "Report",
      icon: "📈",
      submenu: [
        { path: "/reports/orders", label: "Daftar Orderan" },
        { path: "/reports/products", label: "Daftar Produk" },
      ],
    },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (item.adminOnly && user?.role !== "admin") {
      return false;
    }
    return true;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 250,
          backgroundColor: "#1f2937",
          color: "white",
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 20px", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>Gemalery Admin</h1>
        </div>

        <nav style={{ flex: 1, overflowY: "auto" }}>
          {visibleMenuItems.map((item, idx) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const menuKey = item.label.toLowerCase();
            const isExpanded = expandedMenus.has(menuKey);
            const parentActive = hasSubmenu && isParentActive(item.submenu);

            if (hasSubmenu) {
              return (
                <div key={idx}>
                  <button
                    onClick={() => toggleMenu(menuKey)}
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      textAlign: "left",
                      backgroundColor: parentActive ? "#374151" : "transparent",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.95rem",
                    }}
                  >
                    <span>
                      <span style={{ marginRight: 8 }}>{item.icon}</span>
                      {item.label}
                    </span>
                    <span>{isExpanded ? "▼" : "▶"}</span>
                  </button>
                  {isExpanded && (
                    <div style={{ backgroundColor: "#111827", paddingLeft: 20 }}>
                      {item.submenu?.map((subItem, subIdx) => {
                        // Check if submenu path matches current location (including query params)
                        const subPath = subItem.path.split("?")[0];
                        const subQuery = subItem.path.includes("?") ? subItem.path.split("?")[1] : "";
                        const currentPath = location.pathname;
                        const currentQuery = location.search;
                        
                        // Check if path matches and query params match
                        const pathMatches = currentPath === `/admin${subPath}`;
                        const queryMatches = subQuery ? currentQuery.includes(subQuery.split("=")[1]) : !currentQuery;
                        const subActive = pathMatches && (subQuery ? queryMatches : true);
                        
                        return (
                          <button
                            key={subIdx}
                            onClick={() => navigate(`/admin${subItem.path}`)}
                            style={{
                              width: "100%",
                              padding: "10px 20px",
                              textAlign: "left",
                              backgroundColor: subActive ? "#3b82f6" : "transparent",
                              color: subActive ? "white" : "#d1d5db",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              paddingLeft: 40,
                            }}
                          >
                            {subItem.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={idx}
                onClick={() => item.path && navigate(`/admin${item.path}`)}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  textAlign: "left",
                  backgroundColor: isActive(item.path || "") ? "#3b82f6" : "transparent",
                  color: isActive(item.path || "") ? "white" : "white",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.95rem",
                }}
              >
                <span style={{ marginRight: 8 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid #374151" }}>
          <div style={{ marginBottom: 12, fontSize: "0.875rem", color: "#9ca3af" }}>
            {user?.name || user?.email}
          </div>
          <div style={{ marginBottom: 12, fontSize: "0.75rem", color: "#6b7280" }}>
            Role: {user?.role}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => navigate("/home")}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              View Site
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Products Routes */}
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<Products />} />
            <Route
              path="/categories"
              element={
                <AdminOnlyRoute>
                  <Categories />
                </AdminOnlyRoute>
              }
            />
            <Route path="/archive" element={<Archive />} />
            
            {/* Transactions Routes */}
            <Route path="/transactions" element={<Transactions />} />
            
            {/* Users Route */}
            <Route
              path="/users"
              element={
                <AdminOnlyRoute>
                  <Users />
                </AdminOnlyRoute>
              }
            />
            
            {/* POS Route */}
            <Route path="/pos" element={<POS />} />
            
            {/* Reports Routes */}
            <Route path="/reports/orders" element={<Reports />} />
            <Route path="/reports/products" element={<Reports />} />
            
            {/* Legacy routes for backward compatibility */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/addresses" element={<AddressBook />} />
            
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function AdminApp(): React.JSX.Element {
  return (
    <AdminProtectedRoute>
      <SidebarNavigation />
    </AdminProtectedRoute>
  );
}
