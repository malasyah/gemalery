import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { Navigation } from "../components/Navigation.js";

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

export function Home() {
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [latest, setLatest] = useState<Product[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const [rec, lat, pop] = await Promise.all([
          api<Product[]>("/products/recommended"),
          api<Product[]>("/products/latest"),
          api<Product[]>("/products/popular")
        ]);
        setRecommended(rec || []);
        setLatest(lat || []);
        setPopular(pop || []);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Gemalery</h1>
            <p className="text-xl md:text-2xl text-indigo-100 mb-8">
              Discover amazing products at great prices
            </p>
            <Link
              to="/products"
              className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
            >
              Shop Now
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Recommended Products */}
          {recommended.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Produk Rekomendasi</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {recommended.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Latest Products */}
          {latest.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Produk Terbaru</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {latest.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Popular Products */}
          {popular.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Produk Paling Disukai</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {popular.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {recommended.length === 0 && latest.length === 0 && popular.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products available yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

