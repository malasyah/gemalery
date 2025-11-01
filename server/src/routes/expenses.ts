import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const expensesRouter = Router();

const expenseSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().transform((v) => new Date(v)),
  notes: z.string().optional()
});

expensesRouter.get("/expenses", async (_req, res) => {
  const items = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  res.json(items);
});

expensesRouter.post("/expenses", async (req, res) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.expense.create({ data: parsed.data });
  res.status(201).json(created);
});

expensesRouter.patch("/expenses/:id", async (req, res) => {
  const parsed = expenseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.expense.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
});

expensesRouter.delete("/expenses/:id", async (req, res) => {
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.status(204).send();
});


