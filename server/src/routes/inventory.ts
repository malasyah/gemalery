import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const inventoryRouter = Router();

const movementSchema = z.object({
  variantId: z.string(),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number().int(),
  unit_cost_applied: z.number().optional(),
  note: z.string().optional()
});

inventoryRouter.post("/movements", async (req, res) => {
  const parsed = movementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { variantId, type, quantity, unit_cost_applied } = parsed.data;

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return res.status(404).json({ error: "variant not found" });

  const delta = type === "IN" ? quantity : type === "OUT" ? -quantity : quantity; // ADJUST applies raw quantity

  const result = await prisma.$transaction(async (tx) => {
    const move = await tx.stockMovement.create({
      data: {
        productVariantId: variantId,
        type,
        quantity,
        unit_cost_applied: unit_cost_applied ?? null,
        ref_table: "manual",
        ref_id: null
      }
    });

    // Update stock_on_hand
    if (type === "ADJUST") {
      await tx.productVariant.update({ where: { id: variantId }, data: { stock_on_hand: quantity } });
    } else {
      await tx.productVariant.update({ where: { id: variantId }, data: { stock_on_hand: { increment: delta } } });
    }
    return move;
  });
  res.status(201).json(result);
});

inventoryRouter.get("/low-stock", async (req, res) => {
  const threshold = Number(req.query.threshold ?? 5);
  const items = await prisma.productVariant.findMany({ where: { stock_on_hand: { lte: threshold } }, orderBy: { stock_on_hand: "asc" } });
  res.json({ threshold, items });
});


