import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const expensesRouter = Router();

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().transform((v) => new Date(v)),
  notes: z.string().optional()
});

// Get all transactions (with optional type filter)
expensesRouter.get("/transactions", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const { type } = req.query;
    const where: any = {};
    if (type === "INCOME" || type === "EXPENSE") {
      where.type = type;
    }
    const items = await prisma.expense.findMany({ 
      where,
      orderBy: { date: "desc" } 
    });
    res.json(items);
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: error.message || "Failed to fetch transactions" });
  }
});

// Get single transaction
expensesRouter.get("/transactions/:id", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const item = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: "Transaction not found" });
    res.json(item);
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: error.message || "Failed to fetch transaction" });
  }
});

// Create transaction
expensesRouter.post("/transactions", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const created = await prisma.expense.create({ data: parsed.data });
    res.status(201).json(created);
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: error.message || "Failed to create transaction" });
  }
});

// Update transaction
expensesRouter.patch("/transactions/:id", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const parsed = transactionSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const updated = await prisma.expense.update({ 
      where: { id: req.params.id }, 
      data: parsed.data 
    });
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.status(500).json({ error: error.message || "Failed to update transaction" });
  }
});

// Delete transaction
expensesRouter.delete("/transactions/:id", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.status(500).json({ error: error.message || "Failed to delete transaction" });
  }
});

// Legacy routes for backward compatibility
expensesRouter.get("/expenses", requireAuth, requireRole(["admin", "staff"]), async (_req, res) => {
  try {
    const items = await prisma.expense.findMany({ 
      where: { type: "EXPENSE" },
      orderBy: { date: "desc" } 
    });
    res.json(items);
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: error.message || "Failed to fetch expenses" });
  }
});

expensesRouter.post("/expenses", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const expenseSchema = z.object({
      category: z.string().min(1),
      amount: z.number().positive(),
      date: z.string().transform((v) => new Date(v)),
      notes: z.string().optional()
    });
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const created = await prisma.expense.create({ 
      data: { ...parsed.data, type: "EXPENSE" } 
    });
    res.status(201).json(created);
  } catch (error: any) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: error.message || "Failed to create expense" });
  }
});

expensesRouter.patch("/expenses/:id", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const expenseSchema = z.object({
      category: z.string().min(1).optional(),
      amount: z.number().positive().optional(),
      date: z.string().transform((v) => new Date(v)).optional(),
      notes: z.string().optional()
    });
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const updated = await prisma.expense.update({ 
      where: { id: req.params.id }, 
      data: parsed.data 
    });
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating expense:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(500).json({ error: error.message || "Failed to update expense" });
  }
});

expensesRouter.delete("/expenses/:id", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(500).json({ error: error.message || "Failed to delete expense" });
  }
});


