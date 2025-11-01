import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { productsRouter } from "../products.js";
import { prisma } from "../../lib/prisma.js";

const { default: supertest } = await import("supertest");

// Mock Prisma
vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    product: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    productVariant: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

const app = express();
app.use(express.json());
app.use("/products", productsRouter);

describe("Products API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /products", () => {
    it("should create a new product", async () => {
      const mockProduct = {
        id: "test-id",
        name: "Test Product",
        description: "Test Description",
        images: null,
      };

      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

      const response = await supertest(app)
        .post("/products")
        .send({ name: "Test Product", description: "Test Description" })
        .expect(201);

      expect(response.body).toEqual(mockProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { name: "Test Product", description: "Test Description", images: undefined },
      });
    });
  });

  describe("GET /products", () => {
    it("should list all products with variants", async () => {
      const mockProducts = [
        {
          id: "prod-1",
          name: "Product 1",
          variants: [{ id: "var-1", sku: "SKU-1" }],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const response = await supertest(app).get("/products").expect(200);

      expect(response.body).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({ include: { variants: true } });
    });
  });

  describe("PATCH /products/:productId", () => {
    it("should update a product", async () => {
      const mockUpdated = {
        id: "prod-1",
        name: "Updated Product",
        description: "Updated Description",
      };

      vi.mocked(prisma.product.update).mockResolvedValue(mockUpdated as any);

      const response = await supertest(app)
        .patch("/products/prod-1")
        .send({ name: "Updated Product" })
        .expect(200);

      expect(response.body).toEqual(mockUpdated);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { name: "Updated Product" },
      });
    });
  });

  describe("DELETE /products/:productId", () => {
    it("should delete a product", async () => {
      vi.mocked(prisma.product.delete).mockResolvedValue({} as any);

      await request(app).delete("/products/prod-1").expect(204);

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: "prod-1" },
      });
    });
  });
});

