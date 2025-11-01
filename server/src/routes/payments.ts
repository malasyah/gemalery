import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const paymentsRouter = Router();

const paymentSchema = z.object({ method: z.string().min(1), amount: z.number().positive() });

paymentsRouter.post("/orders/:id/payments", async (req, res) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: "order not found" });
  const pay = await prisma.payment.create({ data: { orderId: order.id, method: parsed.data.method, amount: parsed.data.amount, status: "paid" } });
  await prisma.order.update({ where: { id: order.id }, data: { status: "paid" } });
  res.status(201).json(pay);
});


