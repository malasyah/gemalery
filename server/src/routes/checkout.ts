import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export const checkoutRouter = Router();

const addressSchema = z.object({
  label: z.string().optional(),
  recipient_name: z.string().min(1),
  recipient_phone: z.string().min(5),
  address_line: z.string().min(5),
  province: z.string().optional(),
  city: z.string().optional(),
  subdistrict: z.string().optional(),
  postal_code: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  google_place_id: z.string().optional()
});

const checkoutSchema = z.object({
  customerId: z.string().optional(),
  guest: z.object({ name: z.string().min(1), email: z.string().email().optional(), phone: z.string().optional() }).optional(),
  items: z.array(z.object({ variantId: z.string(), qty: z.number().int().positive() })).min(1),
  shipping: z.object({
    addressId: z.string().optional(),
    address: addressSchema.optional(),
    service: z.string().default("JNE REG")
  })
});

function estimateJneCost(weightGram: number): { code: string; name: string; cost: number; etd: string } {
  const base = 10000; // IDR baseline
  const perKg = 6000; // additional per kg
  const kg = Math.ceil(weightGram / 1000);
  const total = base + Math.max(0, kg - 1) * perKg;
  return { code: "REG", name: "JNE REG", cost: total, etd: "2-3" };
}

checkoutRouter.post("/", async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { customerId, guest, items, shipping } = parsed.data;

  // Load variants
  const variantIds = items.map(i => i.variantId);
  const variants = await prisma.productVariant.findMany({ where: { id: { in: variantIds } } });
  if (variants.length !== items.length) return res.status(400).json({ error: "some variants not found" });

  // Totals
  const lines = items.map(i => {
    const v = variants.find(x => x.id === i.variantId)!;
    const price = Number(v.price);
    const line_total = price * i.qty;
    const weight_total = v.weight_gram * i.qty;
    return { ...i, price, line_total, weight_total };
  });
  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  const totalWeight = lines.reduce((s, l) => s + l.weight_total, 0);

  // Shipping address resolve + snapshot
  let addressSnapshot: any = null;
  if (shipping.addressId) {
    const addr = await prisma.customerAddress.findFirst({ where: { id: shipping.addressId, is_deleted: false } });
    if (!addr) return res.status(400).json({ error: "address not found" });
    addressSnapshot = addr;
  } else if (shipping.address) {
    addressSnapshot = shipping.address;
  } else {
    return res.status(400).json({ error: "shipping address required" });
  }

  // Shipping quote (placeholder JNE)
  const quote = estimateJneCost(totalWeight);

  // Channel
  const channel = await prisma.channel.findFirst({ where: { key: "web" } });
  if (!channel) return res.status(500).json({ error: "web channel missing" });

  const order = await prisma.order.create({
    data: {
      channelId: channel.id,
      customerId: customerId || null,
      status: "pending",
      subtotal,
      discount_total: 0,
      fees_total: 0,
      shipping_method: quote.name,
      shipping_cost: quote.cost,
      shipping_address_snapshot: addressSnapshot,
      items: {
        create: lines.map(l => ({ productVariantId: l.variantId, qty: l.qty, price: l.price, cogs_snapshot: 0 }))
      }
    },
    include: { items: true }
  });

  res.status(201).json({ order, shipping_quote: quote });
});


