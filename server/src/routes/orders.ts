import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export const ordersRouter = Router();

const statusSchema = z.object({ status: z.enum(["pending", "paid", "fulfilled", "completed", "cancelled", "refunded"]) });

ordersRouter.get("/", async (_req, res) => {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true, shipments: true } });
  res.json(orders);
});

ordersRouter.get("/:id", async (req, res) => {
  const o = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true, shipments: true, payments: true } });
  if (!o) return res.status(404).json({ error: "Not found" });
  res.json(o);
});

ordersRouter.patch("/:id/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const o = await prisma.order.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });
  res.json(o);
});


