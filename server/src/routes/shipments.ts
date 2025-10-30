import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export const shipmentsRouter = Router();

const fulfillSchema = z.object({ service: z.string().default("JNE REG"), awb: z.string().min(5) });

// Create shipment and attach AWB
shipmentsRouter.post("/orders/:id/fulfill", async (req, res) => {
  const parsed = fulfillSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: "order not found" });
  const shipment = await prisma.shipment.create({ data: { orderId: order.id, carrier: "JNE", service: parsed.data.service, awb: parsed.data.awb } });
  await prisma.order.update({ where: { id: order.id }, data: { status: "fulfilled" } });
  res.status(201).json(shipment);
});

shipmentsRouter.get("/orders/:id/shipments", async (req, res) => {
  const list = await prisma.shipment.findMany({ where: { orderId: req.params.id }, include: { events: true } });
  res.json(list);
});

// Latest tracking event for an order (across its shipments)
shipmentsRouter.get("/orders/:id/tracking/latest", async (req, res) => {
  const shipments = await prisma.shipment.findMany({ where: { orderId: req.params.id }, select: { id: true, carrier: true, service: true, awb: true } });
  if (shipments.length === 0) return res.status(404).json({ error: "no shipments" });
  const shipmentIds = shipments.map(s => s.id);
  const latest = await prisma.shipmentEvent.findFirst({
    where: { shipmentId: { in: shipmentIds } },
    orderBy: [{ event_time: "desc" }]
  });
  res.json({ shipment: shipments[0], latest_event: latest || null });
});


