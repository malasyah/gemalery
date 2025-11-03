import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
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
    sku: string;
    price: number;
    stock_on_hand: number;
    weight_gram: number;
    images?: any;
  }>;
};

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const prod = await api<Product>(`/products/${id}`);
        setProduct(prod);
        if (prod.variants.length > 0) {
          setSelectedVariantId(prod.variants[0].id);
        }
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id]);

  const selectedVariant = product?.variants.find(v => v.id === selectedVariantId);

  // Get all images (product + variant)
  const productImages = product?.images 
    ? (Array.isArray(product.images) ? product.images : [product.images])
    : [];
  const variantImages = selectedVariant?.images
    ? (Array.isArray(selectedVariant.images) ? selectedVariant.images : [selectedVariant.images])
    : [];
  const allImages = [...productImages, ...variantImages];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const addToCart = () => {
    if (!selectedVariant) return;

    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existingItemIndex = cart.findIndex((item: any) => item.variantId === selectedVariant.id);
      
      if (existingItemIndex >= 0) {
        cart[existingItemIndex].qty += quantity;
      } else {
        cart.push({
          variantId: selectedVariant.id,
          productId: product?.id,
          productName: product?.name,
          variantSku: selectedVariant.sku,
          price: Number(selectedVariant.price),
          qty: quantity
        });
      }
      
      localStorage.setItem("cart", JSON.stringify(cart));
      alert("Product added to cart!");
      // Trigger storage event for Navigation component
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert("Failed to add product to cart");
    }
  };

  const buyNow = () => {
    addToCart();
    navigate("/checkout");
  };

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

  if (!product) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Product not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Product Images */}
              <div>
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
                  {allImages.length > 0 && typeof allImages[selectedImageIndex] === "string" ? (
                    <img 
                      src={allImages[selectedImageIndex]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                {allImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === idx ? "border-indigo-600" : "border-gray-200"
                        }`}
                      >
                        {typeof img === "string" ? (
                          <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                {product.category && (
                  <p className="text-indigo-600 mb-4">{product.category.name}</p>
                )}
                
                {selectedVariant && (
                  <p className="text-3xl font-bold text-indigo-600 mb-6">
                    Rp {Number(selectedVariant.price).toLocaleString("id-ID")}
                  </p>
                )}

                {product.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Deskripsi Produk</h2>
                    <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                  </div>
                )}

                {/* Variant Selection */}
                {product.variants.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Varian
                    </label>
                    <div className="space-y-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => {
                            setSelectedVariantId(variant.id);
                            setSelectedImageIndex(0);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                            selectedVariantId === variant.id
                              ? "border-indigo-600 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">SKU: {variant.sku}</p>
                              <p className="text-sm text-gray-600">
                                Rp {Number(variant.price).toLocaleString("id-ID")} | 
                                Stok: {variant.stock_on_hand} | 
                                Berat: {variant.weight_gram}g
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                {selectedVariant && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={selectedVariant.stock_on_hand}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setQuantity(Math.max(1, Math.min(val, selectedVariant.stock_on_hand)));
                          }}
                          className="w-20 text-center border border-gray-300 rounded-lg py-2"
                        />
                        <button
                          onClick={() => setQuantity(Math.min(selectedVariant.stock_on_hand, quantity + 1))}
                          className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          +
                        </button>
                        <span className="text-sm text-gray-600">
                          Stok tersedia: {selectedVariant.stock_on_hand}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={addToCart}
                        disabled={selectedVariant.stock_on_hand === 0}
                        className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={20} />
                        Tambah ke Keranjang
                      </button>
                      <button
                        onClick={buyNow}
                        disabled={selectedVariant.stock_on_hand === 0}
                        className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Beli Sekarang
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

