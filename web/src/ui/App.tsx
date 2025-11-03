import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../contexts/AuthContext.js";
import { Landing } from "../pages/Landing";
import { Home } from "../pages/Home";
import { Products } from "../pages/Products";
import { ProductDetail } from "../pages/ProductDetail";
import { Cart } from "../pages/Cart";
import { Checkout } from "../pages/Checkout";
import { Account } from "../pages/Account";
import { ContactUs } from "../pages/ContactUs";
import { AdminApp } from "./admin/AdminApp";

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
}

function PublicRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/home" /> : <Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/home" />} />
    </Routes>
  );
}

export function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <PublicRoutes />
    </AuthProvider>
  );
}



