import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

export const ordersRouter = Router();

const statusSchema = z.object({ status: z.enum(["pending", "paid", "fulfilled", "completed", "cancelled", "refunded"]) });

ordersRouter.get("/", async (_req, res) => {
  const orders = await prisma.order.findMany({ 
    orderBy: { createdAt: "desc" }, 
    include: { 
      items: {
        select: {
          id: true,
          qty: true,
          price: true,
          cogs_snapshot: true,
          productVariant: {
            select: {
              id: true,
              sku: true,
              product: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        }
      },
      shipments: true,
      payments: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      channel: {
        select: {
          id: true,
          name: true,
          key: true,
        }
      }
    } 
  });
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

// Import order from marketplace (manual entry)
const importOrderSchema = z.object({
  channel: z.enum(["tokopedia", "shopee", "tiktok"]),
  externalOrderId: z.string().min(1),
  userId: z.string().optional(),
  items: z.array(z.object({ variantId: z.string(), qty: z.number().int().positive(), price: z.number().positive() })).min(1),
  subtotal: z.number().nonnegative(),
  discount_total: z.number().nonnegative().default(0),
  fees_total: z.number().nonnegative(), // marketplace fees
  shipping_cost: z.number().nonnegative().default(0),
  shipping_address_snapshot: z.any().optional(),
  awb: z.string().optional(),
  status: z.enum(["pending", "paid", "fulfilled", "completed"]).default("paid")
});

ordersRouter.post("/import", async (req, res) => {
  const parsed = importOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;

  const channel = await prisma.channel.findFirst({ where: { key: data.channel as any } });
  if (!channel) return res.status(400).json({ error: "channel not found" });

  const variantIds = data.items.map(i => i.variantId);
  const variants = await prisma.productVariant.findMany({ where: { id: { in: variantIds } } });
  if (variants.length !== data.items.length) return res.status(400).json({ error: "some variants not found" });

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        channelId: channel.id,
        userId: data.userId || null,
        status: data.status,
        subtotal: data.subtotal,
        discount_total: data.discount_total,
        fees_total: data.fees_total,
        shipping_method: "Marketplace",
        shipping_cost: data.shipping_cost,
        shipping_address_snapshot: data.shipping_address_snapshot || null,
        items: {
          create: data.items.map(it => {
            const v = variants.find(x => x.id === it.variantId)!;
            return { productVariantId: it.variantId, qty: it.qty, price: it.price, cogs_snapshot: Number(v.cogs_current) };
          })
        }
      },
      include: { items: true }
    });

    // Stock movements OUT
    for (const it of data.items) {
      const v = variants.find(x => x.id === it.variantId)!;
      await tx.stockMovement.create({
        data: { productVariantId: it.variantId, type: "OUT", quantity: it.qty, unit_cost_applied: Number(v.cogs_current), ref_table: "order", ref_id: created.id }
      });
      await tx.productVariant.update({ where: { id: it.variantId }, data: { stock_on_hand: { decrement: it.qty } } });
    }

    // Create shipment if AWB provided
    if (data.awb) {
      await tx.shipment.create({
        data: { orderId: created.id, carrier: "JNE", service: "REG", awb: data.awb }
      });
    }

    return created;
  });

  res.status(201).json(order);
});


