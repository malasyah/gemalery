import { Router } from "express";
import { z } from "zod";

export const shippingRouter = Router();

const quoteSchema = z.object({
  origin: z.object({ postal_code: z.string().min(3) }),
  destination: z.object({ postal_code: z.string().min(3) }),
  weight_gram: z.number().int().positive()
});

// Placeholder for JNE quote integration (to be wired with real API)
shippingRouter.post("/quote", async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { weight_gram } = parsed.data;
  // Temporary simple estimation; replace with JNE API integration
  const base = 10000; // IDR baseline
  const perKg = 6000; // per additional kg
  const kg = Math.ceil(weight_gram / 1000);
  const total = base + Math.max(0, kg - 1) * perKg;
  res.json({ currency: "IDR", services: [{ code: "REG", name: "JNE REG", cost: total, etd: "2-3" }] });
});


