# Testing, Linting & Formatting Guide

## Overview
This project uses:
- **Vitest** for unit testing (both backend and frontend)
- **ESLint** for code linting
- **Prettier** for code formatting
- **@vitest/coverage-v8** for code coverage

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run Tests
```bash
# Run all tests (backend + frontend)
npm test

# Run backend tests only
npm --workspace=server test

# Run frontend tests only
npm --workspace=web test

# Run tests with UI
npm --workspace=server test:ui
npm --workspace=web test:ui

# Run tests with coverage
npm run test:coverage
```

### Linting
```bash
# Lint all code
npm run lint

# Lint and auto-fix
npm run lint:fix

# Lint backend only
npm --workspace=server lint

# Lint frontend only
npm --workspace=web lint
```

### Formatting
```bash
# Format all code
npm run format

# Check formatting without changing files
npm run format:check

# Format backend only
npm --workspace=server format

# Format frontend only
npm --workspace=web format
```

## Test Structure

### Backend Tests
- Location: `server/src/**/__tests__/*.test.ts`
- Example: `server/src/routes/__tests__/products.test.ts`

### Frontend Tests
- Location: `web/src/**/__tests__/*.test.{ts,tsx}`
- Example: `web/src/lib/__tests__/api.test.ts`

## Coverage

Coverage reports are generated in:
- Backend: `server/coverage/`
- Frontend: `web/coverage/`

Open `coverage/index.html` in a browser to view detailed coverage reports.

## Configuration Files

- **Vitest**: `server/vitest.config.ts`, `web/vitest.config.ts`
- **ESLint**: `server/.eslintrc.json`, `web/.eslintrc.json`
- **Prettier**: `.prettierrc.json`, `.prettierignore`

## Example Test

### Backend (API Route)
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import supertest from "supertest";
import express from "express";
import { productsRouter } from "../products.js";

const app = express();
app.use(express.json());
app.use("/products", productsRouter);

describe("Products API", () => {
  it("should create a product", async () => {
    const response = await supertest(app)
      .post("/products")
      .send({ name: "Test", description: "Test" })
      .expect(201);
    
    expect(response.body).toHaveProperty("id");
  });
});
```

### Frontend (React Component)
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Products } from "../Products";

describe("Products Page", () => {
  it("should render", () => {
    render(<Products />);
    expect(screen.getByText("Products")).toBeInTheDocument();
  });
});
```

## CI/CD Integration

Add to your CI pipeline:
```yaml
- run: npm run lint
- run: npm run format:check
- run: npm run test:coverage
```

## Best Practices

1. **Write tests for new features** before or alongside implementation
2. **Maintain >80% code coverage** for critical paths
3. **Fix linting errors** before committing
4. **Run formatting** before committing (or use pre-commit hooks)
5. **Mock external dependencies** (database, APIs) in tests
6. **Keep tests focused** - one assertion per test when possible

