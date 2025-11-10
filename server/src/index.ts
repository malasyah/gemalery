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
import { categoriesRouter } from "./routes/categories.js";
import { contactRouter } from "./routes/contact.js";
import { usersRouter } from "./routes/users.js";

dotenv.config();

const app = express();
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const corsOrigin = process.env.CORS_ORIGIN || "";
    const allowedOrigins = corsOrigin ? corsOrigin.split(",").map(o => o.trim()).filter(o => o) : ["*"];
    
    console.log("CORS check - Origin:", origin, "Allowed:", allowedOrigins);
    
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) {
      console.log("CORS: Allowing request with no origin");
      return callback(null, true);
    }
    
    // Allow all origins if "*" is in the list or no CORS_ORIGIN is set
    if (allowedOrigins.includes("*") || allowedOrigins.length === 0) {
      console.log("CORS: Allowing all origins");
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      console.log("CORS: Origin allowed");
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(", ")}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// Increase body parser limit to handle base64 images (50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
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
app.use("/users", usersRouter);
app.use("/customers", customersRouter);
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);
app.use("/contact", contactRouter);
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

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
  console.log(`CORS_ORIGIN: ${process.env.CORS_ORIGIN || "not set (allowing all)"}`);
});



