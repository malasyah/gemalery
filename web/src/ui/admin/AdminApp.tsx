import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.js";
import { AddressBook } from "../pages/AddressBook";
import { Checkout } from "../pages/Checkout";
import { Products } from "../pages/Products";
import { Dashboard } from "../pages/Dashboard";
import { POS } from "../pages/POS";
import { Customers } from "../pages/Customers";

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

function AdminNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === `/admin${path}`;
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/products", label: "Products", icon: "📦" },
    { path: "/customers", label: "Customers", icon: "👥" },
    { path: "/pos", label: "POS", icon: "💰" },
    { path: "/checkout", label: "Checkout", icon: "🛒" },
    { path: "/addresses", label: "Address Book", icon: "📍" },
  ];

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold">Gemalery Admin</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(`/admin${item.path}`)}
                  className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                    isActive(item.path)
                      ? "border-blue-500 text-gray-100"
                      : "border-transparent text-gray-300 hover:border-gray-300 hover:text-gray-100"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
              {user?.name || user?.email} ({user?.role})
            </span>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Logout
            </button>
            <button
              onClick={() => navigate("/home")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              View Site
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(`/admin${item.path}`)}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                isActive(item.path)
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function AdminApp(): React.JSX.Element {
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/addresses" element={<AddressBook />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </AdminProtectedRoute>
  );
}
