import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const productsRouter = Router();

// Helper function to calculate operational cost from category
async function calculateCategoryOperationalCost(categoryId: string | null | undefined): Promise<number> {
  if (!categoryId) return 0;
  
  const category = await prisma.productCategory.findUnique({
    where: { id: categoryId },
    include: { operationalCostComponents: true }
  });
  
  if (!category || !category.operationalCostComponents) return 0;
  
  return category.operationalCostComponents.reduce((sum, component) => {
    return sum + Number(component.cost);
  }, 0);
}

// Create product with variants
productsRouter.post("/", async (req, res) => {
  const { name, description, images, categoryId, variants } = req.body || {};
  
  // Validate product images (max 5)
  if (images) {
    const imageArray = Array.isArray(images) ? images : [images];
    if (imageArray.length > 5) {
      return res.status(400).json({ error: "Maksimal 5 gambar untuk produk" });
    }
  }
  
  if (!name) {
    return res.status(400).json({ error: "Product name is required" });
  }
  
  if (!categoryId) {
    return res.status(400).json({ error: "Category is required" });
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

  // Check if any SKU already exists in database (case-insensitive)
  // Since Prisma doesn't support case-insensitive queries directly, we'll query all variants
  // and filter in JavaScript. For better performance, we could use raw SQL, but this is simpler.
  const skuArray = variants.map((v: any) => String(v.sku).trim().toLowerCase());
  const allVariants = await prisma.productVariant.findMany({
    select: { sku: true }
  });

  // Check for case-insensitive matches
  const existingSkuLower = new Set(allVariants.map(v => v.sku.toLowerCase()));
  for (const variant of variants) {
    const sku = String(variant.sku).trim().toLowerCase();
    if (existingSkuLower.has(sku)) {
      const originalSku = String(variant.sku).trim();
      const existingVariant = allVariants.find(v => v.sku.toLowerCase() === sku);
      return res.status(400).json({ 
        error: `SKU "${originalSku}" sudah digunakan oleh variant lain (SKU: "${existingVariant?.sku}"). SKU harus unik di seluruh sistem (case-insensitive).` 
      });
    }
  }

  // Calculate operational cost from category
  const operationalCost = await calculateCategoryOperationalCost(categoryId);
  
  // Create product with variants in transaction
  try {
    console.log("Creating product with variants:", { name, categoryId, operationalCost, variantsCount: variants.length, variants });
    
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: { name, description, images, categoryId }
      });

      console.log("Product created:", newProduct.id);

      // Create all variants
      const createdVariants = await Promise.all(
        variants.map((v: any, index: number) => {
          // Validate variant images (max 1)
          if (v.images) {
            const variantImageArray = Array.isArray(v.images) ? v.images : [v.images];
            if (variantImageArray.length > 1) {
              throw new Error(`Variant ${index + 1} (SKU: ${v.sku}) hanya boleh memiliki 1 gambar`);
            }
          }
          
          // Validate required fields
          const purchasePrice = Number(v.default_purchase_price) || 0;
          const sellingPrice = Number(v.price) || 0;
          
          if (purchasePrice <= 0) {
            throw new Error(`Variant ${index + 1} (SKU: ${v.sku}): Harga beli wajib diisi`);
          }
          
          if (sellingPrice <= 0) {
            throw new Error(`Variant ${index + 1} (SKU: ${v.sku}): Harga jual wajib diisi`);
          }
          
          // Calculate COGS = purchase price + operational cost
          const cogs = Number(purchasePrice) + Number(operationalCost);
          
          const variantData = {
            productId: newProduct.id,
            sku: String(v.sku).trim(),
            barcode: v.barcode && String(v.barcode).trim() ? String(v.barcode).trim() : null,
            weight_gram: Number(v.weight_gram) || 0,
            stock_on_hand: Number(v.stock_on_hand) || 0,
            price: sellingPrice,
            default_purchase_price: purchasePrice,
            default_operational_cost_unit: operationalCost, // Auto-filled from category
            cogs_current: cogs, // Auto-calculated: purchase_price + operational_cost
            images: v.images ? (Array.isArray(v.images) ? (v.images.length > 0 ? v.images[0] : null) : v.images) : null,
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

// Public routes (must be before admin routes)
productsRouter.get("/public", async (req, res) => {
  try {
    const { categoryId, search } = req.query;
    const where: any = {};
    
    // Only filter by isArchived if column exists (after migration is deployed)
    // If column doesn't exist yet, this will be caught in the catch block
    where.isArchived = false; // Only show non-archived products
    
    if (categoryId) {
      where.categoryId = categoryId as string;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { variants: { some: { sku: { contains: search as string, mode: "insensitive" } } } }
      ];
    }
    
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          where: { stock_on_hand: { gt: 0 } }, // Only show variants with stock
          orderBy: { price: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(products);
  } catch (error: any) {
    console.error("Error fetching public products:", error);
    // If error is about missing column, return all products (backward compatibility)
    if (error.message && (error.message.includes("isArchived") || error.message.includes("column") || error.code === "P2021")) {
      console.warn("isArchived column not found, returning all products. Please deploy migration: npx prisma migrate deploy");
      const { categoryId, search } = req.query;
      const where: any = {};
      if (categoryId) where.categoryId = categoryId as string;
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { description: { contains: search as string, mode: "insensitive" } },
          { variants: { some: { sku: { contains: search as string, mode: "insensitive" } } } }
        ];
      }
      const products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: {
            where: { stock_on_hand: { gt: 0 } },
            orderBy: { price: "asc" }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      return res.json(products);
    }
    res.status(500).json({ error: error.message || "Failed to fetch products" });
  }
});

productsRouter.get("/recommended", async (_req, res) => {
  try {
    // Get 3 products with highest stock (recommendation logic)
    const products = await prisma.product.findMany({
      where: { isArchived: false }, // Only show non-archived products
      include: {
        category: true,
        variants: {
          where: { stock_on_hand: { gt: 0 } },
          orderBy: [{ stock_on_hand: "desc" }, { price: "asc" }],
          take: 1 // Get first variant with stock
        }
      },
      orderBy: { createdAt: "desc" },
      take: 3
    });
    
    // Filter out products with no variants
    const filtered = products.filter(p => p.variants.length > 0);
    res.json(filtered);
  } catch (error: any) {
    console.error("Error fetching recommended products:", error);
    // If error is about missing column, return all products (backward compatibility)
    if (error.message && (error.message.includes("isArchived") || error.message.includes("column") || error.code === "P2021")) {
      console.warn("isArchived column not found, returning all products. Please deploy migration: npx prisma migrate deploy");
      const products = await prisma.product.findMany({
        include: {
          category: true,
          variants: {
            where: { stock_on_hand: { gt: 0 } },
            orderBy: [{ stock_on_hand: "desc" }, { price: "asc" }],
            take: 1
          }
        },
        orderBy: { createdAt: "desc" },
        take: 3
      });
      const filtered = products.filter(p => p.variants.length > 0);
      return res.json(filtered);
    }
    res.status(500).json({ error: error.message || "Failed to fetch recommended products" });
  }
});

productsRouter.get("/latest", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isArchived: false }, // Only show non-archived products
      include: {
        category: true,
        variants: {
          where: { stock_on_hand: { gt: 0 } },
          orderBy: { price: "asc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" },
      take: 3
    });
    
    const filtered = products.filter(p => p.variants.length > 0);
    res.json(filtered);
  } catch (error: any) {
    console.error("Error fetching latest products:", error);
    // If error is about missing column, return all products (backward compatibility)
    if (error.message && (error.message.includes("isArchived") || error.message.includes("column") || error.code === "P2021")) {
      console.warn("isArchived column not found, returning all products. Please deploy migration: npx prisma migrate deploy");
      const products = await prisma.product.findMany({
        include: {
          category: true,
          variants: {
            where: { stock_on_hand: { gt: 0 } },
            orderBy: { price: "asc" },
            take: 1
          }
        },
        orderBy: { createdAt: "desc" },
        take: 3
      });
      const filtered = products.filter(p => p.variants.length > 0);
      return res.json(filtered);
    }
    res.status(500).json({ error: error.message || "Failed to fetch latest products" });
  }
});

productsRouter.get("/popular", async (_req, res) => {
  try {
    // Get products ordered by most order items
    const popularVariants = await prisma.orderItem.groupBy({
      by: ["productVariantId"],
      _count: { productVariantId: true },
      orderBy: { _count: { productVariantId: "desc" } },
      take: 3
    });
    
    if (popularVariants.length === 0) {
      return res.json([]);
    }
    
    const variantIds = popularVariants.map(v => v.productVariantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, stock_on_hand: { gt: 0 } },
      include: {
        product: {
          include: { category: true }
        }
      }
    });
    
    // Group by product and get unique products
    const productMap = new Map();
    variants.forEach(v => {
      // Only include non-archived products (if column exists)
      const isArchived = (v.product as any).isArchived ?? false;
      if (!isArchived && !productMap.has(v.productId)) {
        productMap.set(v.productId, {
          ...v.product,
          variants: []
        });
      }
      if (!isArchived && productMap.has(v.productId)) {
        productMap.get(v.productId).variants.push(v);
      }
    });
    
    const products = Array.from(productMap.values());
    res.json(products);
  } catch (error: any) {
    console.error("Error fetching popular products:", error);
    // If error is about missing column, return all products (backward compatibility)
    if (error.message && (error.message.includes("isArchived") || error.message.includes("column") || error.code === "P2021")) {
      console.warn("isArchived column not found, returning all products. Please deploy migration: npx prisma migrate deploy");
      // Return products without isArchived filter
      const popularVariants = await prisma.orderItem.groupBy({
        by: ["productVariantId"],
        _count: { productVariantId: true },
        orderBy: { _count: { productVariantId: "desc" } },
        take: 3
      });
      if (popularVariants.length === 0) {
        return res.json([]);
      }
      const variantIds = popularVariants.map(v => v.productVariantId);
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds }, stock_on_hand: { gt: 0 } },
        include: {
          product: {
            include: { category: true }
          }
        }
      });
      const productMap = new Map();
      variants.forEach(v => {
        if (!productMap.has(v.productId)) {
          productMap.set(v.productId, {
            ...v.product,
            variants: []
          });
        }
        productMap.get(v.productId).variants.push(v);
      });
      const products = Array.from(productMap.values());
      return res.json(products);
    }
    res.status(500).json({ error: error.message || "Failed to fetch popular products" });
  }
});

productsRouter.get("/categories", async (_req, res) => {
  const categories = await prisma.productCategory.findMany({
    orderBy: { name: "asc" }
  });
  res.json(categories);
});

productsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: {
        orderBy: { price: "asc" }
      }
    }
  });
  
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  
  res.json(product);
});

// List products (admin route)
productsRouter.get("/", async (req, res) => {
  try {
    const { archived } = req.query;
    const where: any = {};
    
    // Filter by archived status if provided
    // Note: If isArchived column doesn't exist yet (migration not deployed), 
    // this will only work after migration is deployed
    if (archived !== undefined) {
      where.isArchived = archived === "true" || archived === "1";
    } else {
      // Default: only show non-archived products if archived param not specified
      // This ensures backward compatibility if column doesn't exist yet
      try {
        where.isArchived = false;
      } catch (e) {
        // If column doesn't exist, just ignore the filter
        // This allows the query to work even if migration isn't deployed yet
      }
    }
    
    const products = await prisma.product.findMany({ 
      where,
      include: { variants: true, category: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    // If error is about missing column, return all products (backward compatibility)
    if (error.message && error.message.includes("isArchived")) {
      console.warn("isArchived column not found, returning all products. Please deploy migration.");
      const products = await prisma.product.findMany({ 
        include: { variants: true, category: true },
        orderBy: { createdAt: "desc" }
      });
      return res.json(products);
    }
    res.status(500).json({ error: error.message || "Failed to fetch products" });
  }
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
    
    // Validate variant images (max 1)
    if (data.images !== undefined) {
      if (data.images !== null) {
        const variantImageArray = Array.isArray(data.images) ? data.images : [data.images];
        if (variantImageArray.length > 1) {
          return res.status(400).json({ error: "Variant hanya boleh memiliki 1 gambar" });
        }
        // Normalize to single image or null
        data.images = variantImageArray.length > 0 ? variantImageArray[0] : null;
      }
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
  const { sku, barcode, weight_gram, stock_on_hand, price, default_purchase_price, default_operational_cost_unit, cogs_current, images } = req.body || {};
  
  if (!sku) {
    return res.status(400).json({ error: "SKU is required" });
  }
  
  // Validate variant images (max 1)
  let normalizedImages = null;
  if (images) {
    const variantImageArray = Array.isArray(images) ? images : [images];
    if (variantImageArray.length > 1) {
      return res.status(400).json({ error: "Variant hanya boleh memiliki 1 gambar" });
    }
    normalizedImages = variantImageArray.length > 0 ? variantImageArray[0] : null;
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
    
    // Calculate COGS from purchase price + operational cost (recalculate to ensure accuracy)
    const purchasePrice = Number(default_purchase_price) || 0;
    const operationalCost = Number(default_operational_cost_unit) || 0;
    const calculatedCogs = Number(purchasePrice) + Number(operationalCost);
    
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku: skuTrimmed,
        barcode: barcode && String(barcode).trim() ? String(barcode).trim() : null,
        weight_gram: Number(weight_gram) || 0,
        stock_on_hand: Number(stock_on_hand) || 0,
        price: Number(price) || 0,
        default_purchase_price: purchasePrice,
        default_operational_cost_unit: operationalCost,
        cogs_current: calculatedCogs,
        images: normalizedImages,
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
  
  // Validate product images (max 5)
  if (data.images !== undefined) {
    if (data.images !== null) {
      const imageArray = Array.isArray(data.images) ? data.images : [data.images];
      if (imageArray.length > 5) {
        return res.status(400).json({ error: "Maksimal 5 gambar untuk produk" });
      }
    }
  }
  
  // Prepare update data
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
  
  const updated = await prisma.product.update({ where: { id: productId }, data: updateData });
  res.json(updated);
});

// Archive product (instead of delete)
productsRouter.patch("/:productId/archive", async (req, res) => {
  const { productId } = req.params;
  
  try {
    // Check if product has related data that prevents deletion
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            _count: {
              select: {
                orderItems: true,
                purchaseItems: true,
                stockMovements: true,
                inventoryLevels: true
              }
            }
          }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Check if any variant has related data
    const hasRelatedData = product.variants.some(v => 
      v._count.orderItems > 0 || 
      v._count.purchaseItems > 0 || 
      v._count.stockMovements > 0 || 
      v._count.inventoryLevels > 0
    );
    
    if (hasRelatedData) {
      // Archive the product instead of deleting
      const archived = await prisma.product.update({
        where: { id: productId },
        data: { isArchived: true }
      });
      
      return res.json({ 
        ...archived,
        message: "Produk diarsipkan karena memiliki data terkait (order, purchase, stock movement, atau inventory). Produk tidak dapat dihapus secara permanen."
      });
    }
    
    // If no related data, just archive it
    const archived = await prisma.product.update({
      where: { id: productId },
      data: { isArchived: true }
    });
    
    res.json(archived);
  } catch (error: any) {
    console.error("Error archiving product:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.status(500).json({ error: error.message || "Failed to archive product" });
  }
});

// Unarchive product
productsRouter.patch("/:productId/unarchive", async (req, res) => {
  const { productId } = req.params;
  
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { isArchived: false }
    });
    
    res.json(product);
  } catch (error: any) {
    console.error("Error unarchiving product:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.status(500).json({ error: error.message || "Failed to unarchive product" });
  }
});


