import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";
import { customersRouter } from "./routes/customers.js";
import { productsRouter } from "./routes/products.js";
import { shippingRouter } from "./routes/shipping.js";
import { authRouter } from "./routes/auth.js";
import { posRouter } from "./routes/pos.js";
import { mapsRouter } from "./routes/maps.js";
import { checkoutRouter } from "./routes/checkout.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { shipmentsRouter } from "./routes/shipments.js";
import { inventoryRouter } from "./routes/inventory.js";
import { expensesRouter } from "./routes/expenses.js";
import { reportsRouter } from "./routes/reports.js";
import { cartRouter } from "./routes/cart.js";
import { integrationsRouter } from "./routes/integrations.js";
import { suppliersRouter } from "./routes/suppliers.js";
import { purchasesRouter } from "./routes/purchases.js";
import { costsRouter } from "./routes/costs.js";

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gemalery-server", time: new Date().toISOString() });
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ status: "error" });
  }
});

// Routes
app.use("/customers", customersRouter);
app.use("/products", productsRouter);
app.use("/shipping", shippingRouter);
app.use("/auth", authRouter);
app.use("/pos", posRouter);
app.use("/maps", mapsRouter);
app.use("/checkout", checkoutRouter);
app.use("/orders", ordersRouter);
app.use("/", paymentsRouter);
app.use("/", shipmentsRouter);
app.use("/inventory", inventoryRouter);
app.use("/", expensesRouter);
app.use("/", reportsRouter);
app.use("/cart", cartRouter);
app.use("/", integrationsRouter);
app.use("/", suppliersRouter);
app.use("/", purchasesRouter);
app.use("/", costsRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
});



