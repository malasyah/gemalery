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

  // Validate variants (case-insensitive SKU comparison)
  const skuSet = new Set<string>();
  for (const variant of variants) {
    if (!variant.sku) {
      return res.status(400).json({ error: "Variant SKU is required" });
    }
    const sku = String(variant.sku).trim().toLowerCase();
    if (skuSet.has(sku)) {
      const originalSku = String(variant.sku).trim();
      return res.status(400).json({ error: `Duplicate SKU found: "${originalSku}". SKU tidak boleh sama (case-insensitive). Setiap variant dalam satu produk harus memiliki SKU yang unik.` });
    }
    skuSet.add(sku);
  }

  // Create product with variants in transaction
  try {
    console.log("Creating product with variants:", { name, variantsCount: variants.length, variants });
    
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: { name, description, images }
      });

      console.log("Product created:", newProduct.id);

      // Create all variants
      const createdVariants = await Promise.all(
        variants.map((v: any, index: number) => {
          const variantData = {
            productId: newProduct.id,
            sku: String(v.sku).trim(),
            barcode: v.barcode && String(v.barcode).trim() ? String(v.barcode).trim() : null,
            weight_gram: Number(v.weight_gram) || 0,
            stock_on_hand: Number(v.stock_on_hand) || 0,
            price: Number(v.price) || 0,
            default_purchase_price: Number(v.default_purchase_price) || 0,
            default_operational_cost_unit: Number(v.default_operational_cost_unit) || 0,
            cogs_current: Number(v.cogs_current) || 0,
          };
          
          console.log(`Creating variant ${index + 1}:`, variantData);
          
          return tx.productVariant.create({
            data: variantData,
          });
        })
      );

      console.log(`Created ${createdVariants.length} variants successfully`);

      return { ...newProduct, variants: createdVariants };
    });

    console.log("Product and variants created successfully");
    res.status(201).json(product);
  } catch (error: any) {
    console.error("Error creating product:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: error.message || "Failed to create product", details: error.code });
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
  
  try {
    // Get current variant to check productId
    const currentVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true, sku: true }
    });
    
    if (!currentVariant) {
      return res.status(404).json({ error: "Variant not found" });
    }
    
    // If SKU is being updated, check for duplicates in the same product (case-insensitive)
    if (data.sku && String(data.sku).trim().toLowerCase() !== currentVariant.sku.toLowerCase()) {
      const skuTrimmed = String(data.sku).trim();
      const skuLower = skuTrimmed.toLowerCase();
      
      // Get all variants in this product
      const existingVariants = await prisma.productVariant.findMany({
        where: {
          productId: currentVariant.productId,
          id: { not: variantId } // Exclude current variant
        }
      });
      
      const duplicate = existingVariants.find(v => v.sku.toLowerCase() === skuLower);
      if (duplicate) {
        return res.status(400).json({ error: `SKU "${skuTrimmed}" sudah ada dalam produk ini (SKU "${duplicate.sku}"). SKU tidak boleh sama meskipun huruf kapital/kecil berbeda. Setiap variant harus memiliki SKU yang unik.` });
      }
      
      data.sku = skuTrimmed;
    }
    
    // Normalize numeric fields
    if (data.weight_gram !== undefined) data.weight_gram = Number(data.weight_gram) || 0;
    if (data.stock_on_hand !== undefined) data.stock_on_hand = Number(data.stock_on_hand) || 0;
    if (data.price !== undefined) data.price = Number(data.price) || 0;
    if (data.default_purchase_price !== undefined) data.default_purchase_price = Number(data.default_purchase_price) || 0;
    if (data.default_operational_cost_unit !== undefined) data.default_operational_cost_unit = Number(data.default_operational_cost_unit) || 0;
    if (data.cogs_current !== undefined) data.cogs_current = Number(data.cogs_current) || 0;
    if (data.barcode !== undefined) {
      data.barcode = data.barcode && String(data.barcode).trim() ? String(data.barcode).trim() : null;
    }
    
    const updated = await prisma.productVariant.update({ where: { id: variantId }, data });
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating variant:", error);
    
    if (error.code === "P2002") {
      return res.status(400).json({ error: "SKU already exists in another product" });
    }
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Variant not found" });
    }
    
    res.status(500).json({ error: error.message || "Failed to update variant" });
  }
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
  
  if (!sku) {
    return res.status(400).json({ error: "SKU is required" });
  }
  
  try {
    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const skuTrimmed = String(sku).trim();
    const skuLower = skuTrimmed.toLowerCase();
    
    // Check if SKU already exists in this product (case-insensitive)
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId }
    });
    
    const duplicate = existingVariants.find(v => v.sku.toLowerCase() === skuLower);
    if (duplicate) {
      return res.status(400).json({ error: `SKU "${skuTrimmed}" sudah ada dalam produk ini (SKU "${duplicate.sku}"). SKU tidak boleh sama meskipun huruf kapital/kecil berbeda. Setiap variant harus memiliki SKU yang unik.` });
    }
    
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku: skuTrimmed,
        barcode: barcode && String(barcode).trim() ? String(barcode).trim() : null,
        weight_gram: Number(weight_gram) || 0,
        stock_on_hand: Number(stock_on_hand) || 0,
        price: Number(price) || 0,
        default_purchase_price: Number(default_purchase_price) || 0,
        default_operational_cost_unit: Number(default_operational_cost_unit) || 0,
        cogs_current: Number(cogs_current) || 0,
      }
    });
    res.status(201).json(variant);
  } catch (error: any) {
    console.error("Error creating variant:", error);
    
    if (error.code === "P2002") {
      return res.status(400).json({ error: "SKU already exists in another product" });
    }
    
    res.status(500).json({ error: error.message || "Failed to create variant" });
  }
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
  
  try {
    // Delete product with all variants in transaction
    await prisma.$transaction(async (tx) => {
      // First delete all variants (to avoid foreign key constraint)
      await tx.productVariant.deleteMany({
        where: { productId }
      });
      
      // Then delete the product
      await tx.product.delete({
        where: { id: productId }
      });
    });
    
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting product:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.status(500).json({ error: error.message || "Failed to delete product" });
  }
});


