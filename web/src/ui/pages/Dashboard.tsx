import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

export function Dashboard(): React.JSX.Element {
  const [sales, setSales] = useState<any>(null);
  const [pnl, setPnl] = useState<any>(null);

  async function load() {
    const s = await api<any>(`/reports/sales`);
    const p = await api<any>(`/reports/profit-loss`);
    setSales(s);
    setPnl(p);
  }

  useEffect(() => { load().catch(() => undefined); }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div>
          <h3>Sales (by day)</h3>
          <pre style={{ background: "#f8f8f8", padding: 8 }}>{JSON.stringify(sales?.byDay || {}, null, 2)}</pre>
        </div>
        <div>
          <h3>Profit & Loss</h3>
          <pre style={{ background: "#f8f8f8", padding: 8 }}>{JSON.stringify(pnl || {}, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}


