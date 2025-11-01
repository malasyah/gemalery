import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ error: "email already registered" });
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed, role: "customer", name } });
  const token = signToken({ id: user.id, role: user.role as any });
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "invalid credentials" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: "invalid credentials" });
  const token = signToken({ id: user.id, role: user.role as any });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});


