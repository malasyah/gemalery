import { Router } from "express";
import { z } from "zod";
import { ChannelKey } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const posRouter = Router();

const posOrderSchema = z.object({
  items: z.array(z.object({ variantId: z.string(), qty: z.number().int().positive() })).min(1),
  userId: z.string().optional()
});

// Staff POS-only create offline order
posRouter.post("/orders", requireAuth, requireRole(["staff", "admin"]), async (req, res) => {
  try {
    const parsed = posOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { items, userId } = parsed.data;

    // load variants
    const variantIds = items.map(i => i.variantId);
    const variants = await prisma.productVariant.findMany({ where: { id: { in: variantIds } } });
    if (variants.length !== items.length) {
      console.error("Variants not found. Expected:", items.length, "Found:", variants.length);
      return res.status(400).json({ error: "some variants not found" });
    }

    // compute subtotal and create snapshot lines
    const lines = items.map(i => {
      const v = variants.find(x => x.id === i.variantId)!;
      const price = Number(v.price);
      const cogs = Number(v.cogs_current);
      return { ...i, price, cogs_snapshot: cogs, line_total: price * i.qty };
    });
    const subtotal = lines.reduce((s, l) => s + l.line_total, 0);

    let channel = await prisma.channel.findFirst({ where: { key: "offline" } });
    if (!channel) {
      console.warn("Offline channel not found, creating it...");
      // Try to create the channel if it doesn't exist
      try {
        channel = await prisma.channel.create({
          data: {
            key: ChannelKey.offline,
            name: "Offline"
          }
        });
        console.log("Offline channel created successfully");
      } catch (createError: any) {
        console.error("Failed to create offline channel:", createError);
        return res.status(500).json({ 
          error: "offline channel missing and could not be created",
          message: createError.message || String(createError)
        });
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          channelId: channel.id,
          userId: userId && userId.trim() !== "" ? userId : null,
          status: "paid",
          subtotal: subtotal,
          discount_total: 0,
          fees_total: 0,
          shipping_cost: 0,
          items: {
            create: lines.map(l => ({ 
              productVariantId: l.variantId, 
              qty: l.qty, 
              price: l.price, 
              cogs_snapshot: l.cogs_snapshot 
            }))
          }
        },
        include: { items: true }
      });

      // stock movements (OUT)
      for (const l of lines) {
        await tx.stockMovement.create({ 
          data: { 
            productVariantId: l.variantId, 
            type: "OUT", 
            quantity: l.qty, 
            unit_cost_applied: l.cogs_snapshot, 
            ref_table: "order", 
            ref_id: created.id 
          } 
        });
        await tx.productVariant.update({ 
          where: { id: l.variantId }, 
          data: { stock_on_hand: { decrement: l.qty } } 
        });
      }

      return created;
    });

    res.status(201).json(order);
  } catch (error: any) {
    console.error("Error creating POS order:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: error.message || String(error),
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});


