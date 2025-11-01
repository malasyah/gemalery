import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const productsRouter = Router();

// Create product
productsRouter.post("/", async (req, res) => {
  const { name, description, images } = req.body || {};
  const product = await prisma.product.create({ data: { name, description, images } });
  res.status(201).json(product);
});

// List products
productsRouter.get("/", async (_req, res) => {
  const products = await prisma.product.findMany({ include: { variants: true } });
  res.json(products);
});

// Create variant
productsRouter.post("/:productId/variants", async (req, res) => {
  const { productId } = req.params;
  const { sku, barcode, weight_gram, stock_on_hand, price, default_purchase_price, default_operational_cost_unit, cogs_current } = req.body || {};
  const variant = await prisma.productVariant.create({
    data: {
      productId,
      sku,
      barcode,
      weight_gram,
      stock_on_hand,
      price,
      default_purchase_price,
      default_operational_cost_unit,
      cogs_current
    }
  });
  res.status(201).json(variant);
});

// Update variant
productsRouter.patch("/variants/:variantId", async (req, res) => {
  const { variantId } = req.params;
  const data = req.body || {};
  const updated = await prisma.productVariant.update({ where: { id: variantId }, data });
  res.json(updated);
});

// Get variant
productsRouter.get("/variants/:variantId", async (req, res) => {
  const { variantId } = req.params;
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return res.status(404).json({ error: "Not found" });
  res.json(variant);
});

// Update product
productsRouter.patch("/:productId", async (req, res) => {
  const { productId } = req.params;
  const data = req.body || {};
  const updated = await prisma.product.update({ where: { id: productId }, data });
  res.json(updated);
});

// Delete product
productsRouter.delete("/:productId", async (req, res) => {
  const { productId } = req.params;
  await prisma.product.delete({ where: { id: productId } });
  res.status(204).send();
});

// Delete variant
productsRouter.delete("/variants/:variantId", async (req, res) => {
  const { variantId } = req.params;
  await prisma.productVariant.delete({ where: { id: variantId } });
  res.status(204).send();
});


