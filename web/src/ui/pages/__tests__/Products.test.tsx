import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Products } from "../Products";
import { api } from "../../../lib/api";

// Mock API
vi.mock("../../../lib/api", () => ({
  api: vi.fn(),
}));

describe("Products Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api).mockResolvedValue([]);
  });

  it("should render product creation form", () => {
    render(<Products />);
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Description")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("should render variant creation form", () => {
    render(<Products />);
    expect(screen.getByPlaceholderText("Product ID")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("SKU")).toBeInTheDocument();
    expect(screen.getByText("Create Variant")).toBeInTheDocument();
  });

  it("should load and display products", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Test Product",
        description: "Test Description",
        variants: [
          {
            id: "var-1",
            sku: "SKU-1",
            weight_gram: 100,
            stock_on_hand: 10,
            price: 10000,
            default_purchase_price: 5000,
            default_operational_cost_unit: 1000,
            cogs_current: 6000,
          },
        ],
      },
    ];

    vi.mocked(api).mockResolvedValue(mockProducts);

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText("Test Product")).toBeInTheDocument();
      expect(screen.getByText("SKU-1")).toBeInTheDocument();
    });
  });
});

