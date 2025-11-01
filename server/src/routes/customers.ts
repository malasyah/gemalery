import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const customersRouter = Router();

// List addresses
customersRouter.get("/:customerId/addresses", async (req, res) => {
  const { customerId } = req.params;
  const addresses = await prisma.customerAddress.findMany({
    where: { customerId, is_deleted: false },
    orderBy: [{ is_default: "desc" }, { createdAt: "asc" }]
  });
  res.json(addresses);
});

// Create address (enforce max 5 active)
customersRouter.post("/:customerId/addresses", async (req, res) => {
  const { customerId } = req.params;
  const count = await prisma.customerAddress.count({ where: { customerId, is_deleted: false } });
  if (count >= 5) {
    return res.status(400).json({ error: "Maximum 5 addresses per customer" });
  }
  const { label, recipient_name, recipient_phone, address_line, province, city, subdistrict, postal_code, lat, lng, google_place_id, is_default } = req.body || {};
  const created = await prisma.$transaction(async (tx) => {
    if (is_default) {
      await tx.customerAddress.updateMany({ where: { customerId }, data: { is_default: false } });
    }
    return tx.customerAddress.create({
      data: { customerId, label, recipient_name, recipient_phone, address_line, province, city, subdistrict, postal_code, lat, lng, google_place_id, is_default: Boolean(is_default) }
    });
  });
  res.status(201).json(created);
});

// Update address
customersRouter.patch("/:customerId/addresses/:addressId", async (req, res) => {
  const { customerId, addressId } = req.params;
  const data = req.body || {};
  const updated = await prisma.$transaction(async (tx) => {
    if (data.is_default) {
      await tx.customerAddress.updateMany({ where: { customerId }, data: { is_default: false } });
    }
    return tx.customerAddress.update({ where: { id: addressId }, data: { ...data, customerId } });
  });
  res.json(updated);
});

// Delete address (soft delete)
customersRouter.delete("/:customerId/addresses/:addressId", async (req, res) => {
  const { addressId } = req.params;
  await prisma.customerAddress.update({ where: { id: addressId }, data: { is_deleted: true, is_default: false } });
  res.status(204).send();
});

// Set default
customersRouter.post("/:customerId/addresses/:addressId/default", async (req, res) => {
  const { customerId, addressId } = req.params;
  const updated = await prisma.$transaction(async (tx) => {
    await tx.customerAddress.updateMany({ where: { customerId }, data: { is_default: false } });
    return tx.customerAddress.update({ where: { id: addressId }, data: { is_default: true } });
  });
  res.json(updated);
});


