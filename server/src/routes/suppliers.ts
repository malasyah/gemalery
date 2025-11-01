import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const suppliersRouter = Router();

const supplierSchema = z.object({ name: z.string().min(1), phone: z.string().optional(), email: z.string().optional(), notes: z.string().optional() });

suppliersRouter.get("/suppliers", async (_req, res) => {
  const list = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  res.json(list);
});

suppliersRouter.post("/suppliers", async (req, res) => {
  const parsed = supplierSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.supplier.create({ data: parsed.data });
  res.status(201).json(created);
});

suppliersRouter.patch("/suppliers/:id", async (req, res) => {
  const parsed = supplierSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.supplier.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
});

suppliersRouter.delete("/suppliers/:id", async (req, res) => {
  await prisma.supplier.delete({ where: { id: req.params.id } });
  res.status(204).send();
});


