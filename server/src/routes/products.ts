import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const productsRouter = Router();

// Create product with variants
productsRouter.post("/", async (req, res) => {
  const { name, description, images, variants } = req.body || {};
  
  if (!name) {
    return res.status(400).json({ error: "Product name is required" });
  }
  
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({ error: "At least one variant is required" });
  }

  // Validate variants
  for (const variant of variants) {
    if (!variant.sku) {
      return res.status(400).json({ error: "Variant SKU is required" });
    }
  }

  // Create product with variants in transaction
  try {
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: { name, description, images }
      });

      // Create all variants
      const createdVariants = await Promise.all(
        variants.map((v: any) =>
          tx.productVariant.create({
            data: {
              productId: newProduct.id,
              sku: v.sku,
              barcode: v.barcode || null,
              weight_gram: Number(v.weight_gram) || 0,
              stock_on_hand: Number(v.stock_on_hand) || 0,
              price: Number(v.price) || 0,
              default_purchase_price: Number(v.default_purchase_price) || 0,
              default_operational_cost_unit: Number(v.default_operational_cost_unit) || 0,
              cogs_current: Number(v.cogs_current) || 0,
            },
          })
        )
      );

      return { ...newProduct, variants: createdVariants };
    });

    res.status(201).json(product);
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: error.message || "Failed to create product" });
  }
});

// List products
productsRouter.get("/", async (_req, res) => {
  const products = await prisma.product.findMany({ include: { variants: true } });
  res.json(products);
});

// Variant routes (must be before /:productId routes to avoid conflict)
productsRouter.patch("/variants/:variantId", async (req, res) => {
  const { variantId } = req.params;
  const data = req.body || {};
  const updated = await prisma.productVariant.update({ where: { id: variantId }, data });
  res.json(updated);
});

productsRouter.get("/variants/:variantId", async (req, res) => {
  const { variantId } = req.params;
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return res.status(404).json({ error: "Not found" });
  res.json(variant);
});

productsRouter.delete("/variants/:variantId", async (req, res) => {
  const { variantId } = req.params;
  await prisma.productVariant.delete({ where: { id: variantId } });
  res.status(204).send();
});

// Product-specific routes
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

// Generic product routes (must be after variant routes)
productsRouter.patch("/:productId", async (req, res) => {
  const { productId } = req.params;
  const data = req.body || {};
  const updated = await prisma.product.update({ where: { id: productId }, data });
  res.json(updated);
});

productsRouter.delete("/:productId", async (req, res) => {
  const { productId } = req.params;
  await prisma.product.delete({ where: { id: productId } });
  res.status(204).send();
});


