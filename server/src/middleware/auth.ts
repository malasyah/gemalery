import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export type JwtUser = { id: string; role: "admin" | "staff" | "customer" };

export function signToken(user: JwtUser): string {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(user, secret, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    const payload = jwt.verify(token, secret) as JwtUser;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(roles: JwtUser["role"][] | JwtUser["role"]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtUser | undefined;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}


