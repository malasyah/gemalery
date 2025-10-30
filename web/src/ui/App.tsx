import React, { useState } from "react";
import { AddressBook } from "./pages/AddressBook";
import { Checkout } from "./pages/Checkout";
import { Products } from "./pages/Products";
import { Dashboard } from "./pages/Dashboard";

export function App(): React.JSX.Element {
  const [tab, setTab] = useState<"checkout" | "addresses" | "products" | "dashboard">("checkout");
  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Gemalery</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setTab("checkout")}>Checkout</button>
        <button onClick={() => setTab("addresses")}>Address Book</button>
        <button onClick={() => setTab("products")}>Products</button>
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
      </div>
      {tab === "checkout" && <Checkout />}
      {tab === "addresses" && <AddressBook />}
      {tab === "products" && <Products />}
      {tab === "dashboard" && <Dashboard />}
    </div>
  );
}



