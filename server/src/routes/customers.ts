import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const customersRouter = Router();

// List all customers
customersRouter.get("/", async (_req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        user: {
          select: { email: true, name: true }
        },
        _count: {
          select: { orders: true, addresses: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(customers);
  } catch (error: any) {
    console.error("Error listing customers:", error);
    res.status(500).json({ error: error.message || "Failed to list customers" });
  }
});

// Get customer by ID
customersRouter.get("/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      user: {
        select: { email: true, name: true }
      },
      addresses: {
        where: { is_deleted: false },
        orderBy: [{ is_default: "desc" }, { createdAt: "asc" }]
      },
      _count: {
        select: { orders: true }
      }
    }
  });
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

// Create customer (admin/staff only - auto-set userId from logged-in user)
customersRouter.post("/", requireAuth, async (req, res) => {
  const { name, phone, email } = req.body || {};
  const loggedInUser = (req as any).user;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Customer name is required" });
  }
  
  try {
    // Auto-set userId from logged-in user (admin/staff)
    // Only set userId if logged-in user is admin or staff
    let actualUserId: string | null = null;
    
    if (loggedInUser && (loggedInUser.role === "admin" || loggedInUser.role === "staff")) {
      // Check if user already has a customer
      const existingCustomer = await prisma.customer.findUnique({
        where: { userId: loggedInUser.id }
      });
      if (!existingCustomer) {
        actualUserId = loggedInUser.id;
      }
    }
    
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone && phone.trim() ? phone.trim() : null,
        email: email && email.trim() ? email.trim() : null,
        photo: req.body.photo && req.body.photo.trim() ? req.body.photo.trim() : null,
        userId: actualUserId
      },
      include: {
        user: actualUserId ? {
          select: { email: true, name: true }
        } : false
      }
    });
    
    res.status(201).json(customer);
  } catch (error: any) {
    console.error("Error creating customer:", error);
    console.error("Error details:", { code: error.code, meta: error.meta });
    
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Duplicate entry. Email or phone may already exist." });
    }
    
    if (error.code === "P2003") {
      return res.status(400).json({ error: "Invalid userId. User not found." });
    }
    
    res.status(500).json({ error: error.message || "Failed to create customer" });
  }
});

// Update customer
customersRouter.patch("/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const { name, phone, email, photo, userId } = req.body || {};
  
  try {
    // If userId is being updated, check if it's available
    if (userId) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          userId,
          id: { not: customerId }
        }
      });
      if (existingCustomer) {
        return res.status(400).json({ error: "User already linked to another customer" });
      }
    }
    
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(photo !== undefined && { photo: photo || null }),
        ...(userId !== undefined && { userId: userId || null })
      },
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating customer:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    res.status(500).json({ error: error.message || "Failed to update customer" });
  }
});

// Delete customer
customersRouter.delete("/:customerId", async (req, res) => {
  const { customerId } = req.params;
  
  try {
    await prisma.customer.delete({
      where: { id: customerId }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    res.status(500).json({ error: error.message || "Failed to delete customer" });
  }
});

// Address routes
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

// Get customer orders
customersRouter.get("/:customerId/orders", async (req, res) => {
  try {
    const { customerId } = req.params;
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  }
                }
              }
            }
          }
        },
        channel: {
          select: {
            name: true,
            key: true,
          }
        },
        payments: true,
        shipments: true,
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders);
  } catch (error: any) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ error: error.message || "Failed to fetch customer orders" });
  }
});


