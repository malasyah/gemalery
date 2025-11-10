import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

export const usersRouter = Router();

// List all users (admin only)
usersRouter.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
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
        role: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            photo: true
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

// Create user (admin only)
usersRouter.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { email, password, name, role } = req.body || {};
  
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
        role: role as "admin" | "staff" | "customer"
      },
      select: {
        id: true,
        email: true,
        name: true,
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
  const { email, password, name, role } = req.body || {};
  
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
        role: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            photo: true
          }
        }
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
        error: "Cannot delete user. User has related records (orders, customers, etc.). Please remove related records first." 
      });
    }
    
    res.status(500).json({ error: error.message || "Failed to delete user" });
  }
});

