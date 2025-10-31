import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export const purchasesRouter = Router();

const poSchema = z.object({ supplierId: z.string(), notes: z.string().optional() });
const itemSchema = z.object({ productVariantId: z.string(), qty: z.number().int().positive(), unit_cost: z.number().positive(), operational_cost_unit: z.number().nonnegative().default(0) });

purchasesRouter.post("/purchase-orders", async (req, res) => {
  const parsed = poSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const po = await prisma.purchaseOrder.create({ data: { supplierId: parsed.data.supplierId, status: "draft", notes: parsed.data.notes } });
  res.status(201).json(po);
});

purchasesRouter.post("/purchase-orders/:id/items", async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { id } = req.params;
  const landed = parsed.data.unit_cost + parsed.data.operational_cost_unit;
  const item = await prisma.purchaseItem.create({
    data: {
      purchaseOrderId: id,
      productVariantId: parsed.data.productVariantId,
      qty: parsed.data.qty,
      unit_cost: parsed.data.unit_cost,
      operational_cost_unit: parsed.data.operational_cost_unit,
      landed_cost_unit: landed
    }
  });
  res.status(201).json(item);
});

// Receive PO: commit to stock and update COGS (weighted average)
purchasesRouter.post("/purchase-orders/:id/receive", async (req, res) => {
  const { id } = req.params;
  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!po) return res.status(404).json({ error: "PO not found" });
  if (po.items.length === 0) return res.status(400).json({ error: "No items in PO" });

  const result = await prisma.$transaction(async (tx) => {
    for (const it of po.items) {
      const variant = await tx.productVariant.findUnique({ where: { id: it.productVariantId } });
      if (!variant) throw new Error("Variant not found");
      const currentQty = variant.stock_on_hand;
      const currentCogs = Number(variant.cogs_current);
      const inQty = it.qty;
      const landed = Number(it.landed_cost_unit);
      const newQty = currentQty + inQty;
      const newCogs = newQty === 0 ? landed : ((currentQty * currentCogs) + (inQty * landed)) / newQty;

      await tx.stockMovement.create({ data: { productVariantId: variant.id, type: "IN", quantity: inQty, unit_cost_applied: landed, ref_table: "purchase_order", ref_id: po.id } });
      await tx.productVariant.update({ where: { id: variant.id }, data: { stock_on_hand: { increment: inQty }, cogs_current: newCogs } });
    }

    const updated = await tx.purchaseOrder.update({ where: { id: po.id }, data: { status: "received", receivedAt: new Date() } });
    return updated;
  });

  res.json(result);
});

purchasesRouter.get("/purchase-orders/:id", async (req, res) => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!po) return res.status(404).json({ error: "Not found" });
  res.json(po);
});

purchasesRouter.get("/purchase-orders", async (_req, res) => {
  const list = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: "desc" } });
  res.json(list);
});


