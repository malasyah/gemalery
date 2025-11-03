import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const categoriesRouter = Router();

// Public: List all categories
categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.productCategory.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: "asc" }
  });
  res.json(categories);
});

// Admin only: Create category
categoriesRouter.post("/", requireAuth, requireRole(["admin"]), async (req, res) => {
  const { name, description } = req.body || {};
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required" });
  }
  
  try {
    const category = await prisma.productCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });
    res.status(201).json(category);
  } catch (error: any) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: error.message || "Failed to create category" });
  }
});

// Admin only: Update category
categoriesRouter.patch("/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body || {};
  
  try {
    const updated = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null })
      }
    });
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating category:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.status(500).json({ error: error.message || "Failed to update category" });
  }
});

// Admin only: Delete category
categoriesRouter.delete("/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  const { id } = req.params;
  
  try {
    await prisma.productCategory.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting category:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Check if category has products
    if (error.code === "P2003") {
      return res.status(400).json({ error: "Cannot delete category with existing products. Please remove products first." });
    }
    
    res.status(500).json({ error: error.message || "Failed to delete category" });
  }
});

