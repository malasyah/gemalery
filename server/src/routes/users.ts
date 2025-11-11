import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

export const usersRouter = Router();

// List all users (admin only) with search and filter
usersRouter.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { search, role } = req.query;
    
    const where: any = {};
    
    // Search by name, email, or phone
    if (search && typeof search === "string" && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm, mode: "insensitive" } }
      ];
    }
    
    // Filter by role
    if (role && typeof role === "string" && ["admin", "staff", "customer"].includes(role)) {
      where.role = role;
    }
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        photo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            addresses: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(users);
  } catch (error: any) {
    console.error("Error listing users:", error);
    res.status(500).json({ error: error.message || "Failed to list users" });
  }
});

// Get user by ID (admin only)
usersRouter.get("/:userId", requireAuth, requireRole("admin"), async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        photo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            addresses: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error: any) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: error.message || "Failed to get user" });
  }
});

// Get user orders
usersRouter.get("/:userId/orders", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await prisma.order.findMany({
      where: { userId },
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
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: error.message || "Failed to fetch user orders" });
  }
});

// Get user addresses
usersRouter.get("/:userId/addresses", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { userId } = req.params;
    const addresses = await prisma.userAddress.findMany({
      where: { userId, is_deleted: false },
      orderBy: [{ is_default: "desc" }, { createdAt: "asc" }]
    });
    res.json(addresses);
  } catch (error: any) {
    console.error("Error fetching user addresses:", error);
    res.status(500).json({ error: error.message || "Failed to fetch user addresses" });
  }
});

// Create user (admin only)
usersRouter.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { email, password, name, role, phone, photo } = req.body || {};
  
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  if (!password || !password.trim()) {
    return res.status(400).json({ error: "Password is required" });
  }
  
  if (!role || !["admin", "staff", "customer"].includes(role)) {
    return res.status(400).json({ error: "Valid role is required (admin, staff, or customer)" });
  }
  
  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  
  try {
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashed,
        name: name && name.trim() ? name.trim() : null,
        phone: phone && phone.trim() ? phone.trim() : null,
        photo: photo && photo.trim() ? photo.trim() : null,
        role: role as "admin" | "staff" | "customer"
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        photo: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(201).json(user);
  } catch (error: any) {
    console.error("Error creating user:", error);
    
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    res.status(500).json({ error: error.message || "Failed to create user" });
  }
});

// Update user (admin only)
usersRouter.patch("/:userId", requireAuth, requireRole("admin"), async (req, res) => {
  const { userId } = req.params;
  const { email, password, name, role, phone, photo } = req.body || {};
  
  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (email !== undefined) {
      if (!email || !email.trim()) {
        return res.status(400).json({ error: "Email cannot be empty" });
      }
      // Check if email is already taken by another user
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.trim(),
          id: { not: userId }
        }
      });
      if (emailExists) {
        return res.status(400).json({ error: "Email already registered" });
      }
      updateData.email = email.trim();
    }
    
    if (name !== undefined) {
      updateData.name = name && name.trim() ? name.trim() : null;
    }
    
    if (phone !== undefined) {
      updateData.phone = phone && phone.trim() ? phone.trim() : null;
    }
    
    if (photo !== undefined) {
      updateData.photo = photo && photo.trim() ? photo.trim() : null;
    }
    
    if (role !== undefined) {
      if (!["admin", "staff", "customer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be admin, staff, or customer" });
      }
      updateData.role = role;
    }
    
    if (password !== undefined) {
      if (password && password.trim()) {
        if (password.length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters" });
        }
        updateData.password = await bcrypt.hash(password, 10);
      } else {
        return res.status(400).json({ error: "Password cannot be empty" });
      }
    }
    
    // Update user
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        photo: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating user:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    res.status(500).json({ error: error.message || "Failed to update user" });
  }
});

// Delete user (admin only)
usersRouter.delete("/:userId", requireAuth, requireRole("admin"), async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Prevent deleting yourself
    const loggedInUser = (req as any).user;
    if (loggedInUser && loggedInUser.id === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    
    // Delete user (cascade will handle related records if configured)
    await prisma.user.delete({
      where: { id: userId }
    });
    
    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Handle foreign key constraint errors
    if (error.code === "P2003") {
      return res.status(400).json({ 
        error: "Cannot delete user. User has related records (orders, addresses, etc.). Please remove related records first." 
      });
    }
    
    res.status(500).json({ error: error.message || "Failed to delete user" });
  }
});

