import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const cartRouter = Router();

const priceSchema = z.object({
  items: z.array(z.object({ variantId: z.string(), qty: z.number().int().positive() })).min(1),
  shipping: z.object({ addressId: z.string().optional() }).optional()
});

function estimateJneCost(weightGram: number): { code: string; name: string; cost: number; etd: string } {
  const base = 10000;
  const perKg = 6000;
  const kg = Math.ceil(weightGram / 1000);
  const total = base + Math.max(0, kg - 1) * perKg;
  return { code: "REG", name: "JNE REG", cost: total, etd: "2-3" };
}

// Calculate cart totals and JNE estimate (no persistence)
cartRouter.post("/price", async (req, res) => {
  const parsed = priceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { items } = parsed.data;

  const variantIds = items.map(i => i.variantId);
  const variants = await prisma.productVariant.findMany({ where: { id: { in: variantIds } } });
  if (variants.length !== items.length) return res.status(400).json({ error: "some variants not found" });

  const lines = items.map(i => {
    const v = variants.find(x => x.id === i.variantId)!;
    const price = Number(v.price);
    const line_total = price * i.qty;
    const weight_total = v.weight_gram * i.qty;
    return { variantId: i.variantId, qty: i.qty, price, line_total, weight_total };
  });
  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  const totalWeight = lines.reduce((s, l) => s + l.weight_total, 0);
  const shipping_quote = estimateJneCost(totalWeight);

  res.json({ lines, subtotal, shipping_quote });
});


