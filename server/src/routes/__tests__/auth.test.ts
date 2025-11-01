import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import { authRouter } from "../auth.js";
import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcryptjs";
import supertest from "supertest";

// Mock Prisma
vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        password: "hashed-password",
        role: "customer",
      };

      vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const response = await supertest(app)
        .post("/auth/register")
        .send({ email: "test@example.com", password: "password123", role: "customer" })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email", "test@example.com");
      expect(response.body).not.toHaveProperty("password");
    });
  });
});

