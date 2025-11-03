import React, { useState } from "react";
import { AddressBook } from "./pages/AddressBook";
import { Checkout } from "./pages/Checkout";
import { Products } from "./pages/Products";
import { Dashboard } from "./pages/Dashboard";
import { POS } from "./pages/POS";
import { Customers } from "./pages/Customers";

export function App(): React.JSX.Element {
  const [tab, setTab] = useState<"checkout" | "addresses" | "products" | "dashboard" | "pos" | "customers">("checkout");
  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Gemalery</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setTab("checkout")}>Checkout</button>
        <button onClick={() => setTab("customers")}>Customers</button>
        <button onClick={() => setTab("addresses")}>Address Book</button>
        <button onClick={() => setTab("products")}>Products</button>
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("pos")}>POS</button>
      </div>
      {tab === "checkout" && <Checkout />}
      {tab === "customers" && <Customers />}
      {tab === "addresses" && <AddressBook />}
      {tab === "products" && <Products />}
      {tab === "dashboard" && <Dashboard />}
      {tab === "pos" && <POS />}
    </div>
  );
}



