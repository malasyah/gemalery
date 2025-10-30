import { Router } from "express";
import { prisma } from "../lib/prisma";

export const reportsRouter = Router();

// Sales summary by day (and optional channel)
reportsRouter.get("/reports/sales", async (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  const channel = req.query.channel as string | undefined;

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      ...(channel ? { channel: { key: channel as any } } : {})
    },
    select: { createdAt: true, subtotal: true, discount_total: true, shipping_cost: true }
  });
  const byDay: Record<string, { revenue: number; orders: number }> = {};
  for (const o of orders) {
    const d = o.createdAt.toISOString().slice(0, 10);
    const rev = Number(o.subtotal) - Number(o.discount_total) + Number(o.shipping_cost);
    byDay[d] = byDay[d] || { revenue: 0, orders: 0 };
    byDay[d].revenue += rev;
    byDay[d].orders += 1;
  }
  res.json({ from, to, channel: channel || null, byDay });
});

// Profit & Loss for a period
reportsRouter.get("/reports/profit-loss", async (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: { items: true }
  });
  const expenses = await prisma.expense.findMany({ where: { date: { gte: from, lte: to } } });

  let revenue = 0;
  let discounts = 0;
  let shippingRevenue = 0; // shipping charged to customer
  let cogs = 0;
  let fees = 0; // marketplace/platform fees if recorded in orders.fees_total
  let shippingCost = 0; // if you record actual shipping cost later, sum here (future)

  for (const o of orders) {
    revenue += Number(o.subtotal);
    discounts += Number(o.discount_total);
    shippingRevenue += Number(o.shipping_cost);
    fees += Number(o.fees_total);
    for (const it of o.items) {
      cogs += Number(it.cogs_snapshot) * it.qty;
    }
  }

  const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const grossProfit = revenue - cogs - fees;
  const netProfit = revenue + shippingRevenue - discounts - cogs - fees - shippingCost - expensesTotal;

  res.json({
    period: { from, to },
    revenue,
    shippingRevenue,
    discounts,
    fees,
    cogs,
    shippingCost,
    expenses: expensesTotal,
    grossProfit,
    netProfit
  });
});


