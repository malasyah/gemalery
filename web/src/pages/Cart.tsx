import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";
import { Navigation } from "../components/Navigation.js";
import { api } from "../lib/api.js";

type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantSku: string;
  price: number;
  qty: number;
};

type VariantInfo = {
  id: string;
  sku: string;
  price: number;
  stock_on_hand: number;
  product: {
    id: string;
    name: string;
    images?: any;
  };
  images?: any;
};

export function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [variantInfos, setVariantInfos] = useState<Record<string, VariantInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(cart);

      // Fetch variant info for all items
      if (cart.length > 0) {
        const variantIds = cart.map((item: CartItem) => item.variantId);
        const infos: Record<string, VariantInfo> = {};
        
        await Promise.all(
          variantIds.map(async (variantId: string) => {
            try {
              const variant = await api<VariantInfo>(`/products/variants/${variantId}`);
              infos[variantId] = variant;
            } catch (error) {
              console.error(`Failed to load variant ${variantId}:`, error);
            }
          })
        );
        
        setVariantInfos(infos);
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setLoading(false);
    }
  }

  const updateQuantity = (variantId: string, newQty: number) => {
    if (newQty < 1) {
      removeItem(variantId);
      return;
    }

    const variant = variantInfos[variantId];
    if (variant && newQty > variant.stock_on_hand) {
      alert(`Maximum stock available: ${variant.stock_on_hand}`);
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updated = cart.map((item: CartItem) =>
      item.variantId === variantId ? { ...item, qty: newQty } : item
    );
    localStorage.setItem("cart", JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event("storage"));
  };

  const removeItem = (variantId: string) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updated = cart.filter((item: CartItem) => item.variantId !== variantId);
    localStorage.setItem("cart", JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event("storage"));
  };

  const clearCart = () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      localStorage.removeItem("cart");
      setCartItems([]);
      window.dispatchEvent(new Event("storage"));
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

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

  if (cartItems.length === 0) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-6">Your cart is empty</p>
              <Link
                to="/products"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Clear Cart
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const variant = variantInfos[item.variantId];
                const images = variant?.images 
                  ? (Array.isArray(variant.images) ? variant.images : [variant.images])
                  : [];
                const productImages = variant?.product.images
                  ? (Array.isArray(variant.product.images) ? variant.product.images : [variant.product.images])
                  : [];
                const allImages = [...productImages, ...images];
                const imageUrl = allImages.length > 0 && typeof allImages[0] === "string" ? allImages[0] : null;

                return (
                  <div key={item.variantId} className="bg-white rounded-lg shadow-md p-4 flex gap-4">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.productName} className="w-24 h-24 object-cover rounded" />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      <Link to={`/products/${item.productId}`} className="font-semibold text-gray-900 hover:text-indigo-600">
                        {item.productName}
                      </Link>
                      <p className="text-sm text-gray-600">SKU: {item.variantSku}</p>
                      <p className="text-lg font-bold text-indigo-600 mt-2">
                        Rp {item.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.qty - 1)}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.qty + 1)}
                          disabled={variant ? item.qty >= variant.stock_on_hand : false}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Total: Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Proceed to Checkout
                </button>
                <Link
                  to="/products"
                  className="block text-center text-gray-600 hover:text-gray-900 mt-4"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

