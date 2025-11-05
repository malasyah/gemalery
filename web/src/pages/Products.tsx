import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { Navigation } from "../components/Navigation.js";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  images?: any;
  category?: { name: string } | null;
  variants: Array<{
    id: string;
    price: number;
    stock_on_hand: number;
    images?: any;
  }>;
};

function ProductCard({ product }: { product: Product }) {
  // Get main image (first product image)
  const images = product.images ? (Array.isArray(product.images) ? product.images : [product.images]) : [];
  const mainImage = images.length > 0 ? images[0] : "/placeholder.jpg";
  const price = product.variants.length > 0 ? Number(product.variants[0].price) : 0;

  return (
    <Link to={`/products/${product.id}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
      <div className="aspect-square bg-gray-100 relative">
        {typeof mainImage === "string" && mainImage !== "/placeholder.jpg" ? (
          <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        {product.category && (
          <p className="text-sm text-gray-500 mb-2">{product.category.name}</p>
        )}
        <p className="text-lg font-bold text-indigo-600">
          Rp {price.toLocaleString("id-ID")}
        </p>
      </div>
    </Link>
  );
}

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category") || null
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await api<Category[]>("/categories");
        setCategories(cats || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set("categoryId", selectedCategory);
        if (searchQuery) params.set("search", searchQuery);
        
        const prods = await api<Product[]>(`/products/public?${params.toString()}`);
        setProducts(prods || []);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [selectedCategory, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    setSearchParams(params);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Categories */}
            <aside className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
                <h3 className="font-semibold text-gray-900 mb-4">Kategori</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-3 py-2 rounded-md transition ${
                        selectedCategory === null
                          ? "bg-indigo-100 text-indigo-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      All Products
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-md transition ${
                          selectedCategory === cat.id
                            ? "bg-indigo-100 text-indigo-700 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Products Grid */}
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No products found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

