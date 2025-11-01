import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import { productsRouter } from "../products.js";
import { prisma } from "../../lib/prisma.js";
import supertest from "supertest";

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
    $transaction: vi.fn(),
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
    it("should create a new product with variants", async () => {
      const mockProduct = {
        id: "test-id",
        name: "Test Product",
        description: "Test Description",
        images: null,
      };

      const mockVariants = [
        {
          id: "var-1",
          productId: "test-id",
          sku: "SKU-1",
          weight_gram: 100,
          stock_on_hand: 10,
          price: 10000,
          default_purchase_price: 5000,
          default_operational_cost_unit: 1000,
          cogs_current: 6000,
        },
      ];

      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.productVariant.create).mockResolvedValue(mockVariants[0] as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          product: { create: prisma.product.create },
          productVariant: { create: prisma.productVariant.create },
        };
        return callback(tx);
      });

      const response = await supertest(app)
        .post("/products")
        .send({
          name: "Test Product",
          description: "Test Description",
          variants: [
            {
              sku: "SKU-1",
              weight_gram: 100,
              stock_on_hand: 10,
              price: 10000,
              default_purchase_price: 5000,
              default_operational_cost_unit: 1000,
              cogs_current: 6000,
            },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("variants");
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

      await supertest(app).delete("/products/prod-1").expect(204);

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: "prod-1" },
      });
    });
  });
});

