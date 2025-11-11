import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { Navigation } from "../components/Navigation.js";
import { useAuth } from "../contexts/AuthContext.js";

type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantSku: string;
  price: number;
  qty: number;
};

type Address = {
  id: string;
  recipient_name: string;
  recipient_phone: string;
  address_line: string;
  city?: string;
  province?: string;
  postal_code?: string;
  is_default: boolean;
};

export function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    recipient_name: "",
    recipient_phone: "",
    address_line: "",
    city: "",
    province: "",
    postal_code: "",
  });
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);

    if (user?.id) {
      loadAddresses(user.id);
    }
  }, [user]);

  async function loadAddresses(userId: string) {
    try {
      const addrs = await api<Address[]>(`/users/${userId}/addresses`);
      setAddresses(addrs || []);
      const defaultAddr = addrs.find(a => a.is_default);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    } catch (error) {
      console.error("Failed to load addresses:", error);
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingCost = 0; // TODO: Calculate shipping from JNE API
  const total = subtotal + shippingCost;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    let shippingAddress;
    if (useNewAddress) {
      if (!newAddress.recipient_name || !newAddress.recipient_phone || !newAddress.address_line) {
        alert("Please fill in all required address fields");
        return;
      }
      shippingAddress = newAddress;
    } else if (selectedAddressId) {
      const addr = addresses.find(a => a.id === selectedAddressId);
      if (!addr) {
        alert("Please select an address");
        return;
      }
      shippingAddress = {
        recipient_name: addr.recipient_name,
        recipient_phone: addr.recipient_phone,
        address_line: addr.address_line,
        city: addr.city,
        province: addr.province,
        postal_code: addr.postal_code,
      };
    } else {
      alert("Please select or enter a shipping address");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        items: cartItems.map(item => ({ variantId: item.variantId, qty: item.qty })),
        shipping: { address: shippingAddress }
      };

      if (user?.id) {
        payload.userId = user.id;
      } else {
        payload.guest = { name: newAddress.recipient_name };
      }

      const order = await api<any>("/checkout", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // Clear cart
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("storage"));

      // Navigate to success page or order details
      navigate(`/orders/${order.id}`, { state: { order } });
    } catch (error: any) {
      alert("Failed to place order: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-6">Your cart is empty</p>
            <button
              onClick={() => navigate("/products")}
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Continue Shopping
            </button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
                
                {user?.id && addresses.length > 0 && (
                  <>
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          setUseNewAddress(false);
                          setSelectedAddressId(addresses[0]?.id || null);
                        }}
                        className={`px-4 py-2 rounded-lg transition ${
                          !useNewAddress ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Use Saved Address
                      </button>
                      <button
                        onClick={() => setUseNewAddress(true)}
                        className={`ml-2 px-4 py-2 rounded-lg transition ${
                          useNewAddress ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        New Address
                      </button>
                    </div>

                    {!useNewAddress && (
                      <div className="space-y-2">
                        {addresses.map((addr) => (
                          <label
                            key={addr.id}
                            className={`block p-4 border-2 rounded-lg cursor-pointer ${
                              selectedAddressId === addr.id
                                ? "border-indigo-600 bg-indigo-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="address"
                              value={addr.id}
                              checked={selectedAddressId === addr.id}
                              onChange={(e) => setSelectedAddressId(e.target.value)}
                              className="sr-only"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{addr.recipient_name}</p>
                              <p className="text-sm text-gray-600">{addr.recipient_phone}</p>
                              <p className="text-sm text-gray-700">{addr.address_line}</p>
                              {addr.city && <p className="text-sm text-gray-600">{addr.city}</p>}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {useNewAddress || !user?.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.recipient_name}
                        onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={newAddress.recipient_phone}
                        onChange={(e) => setNewAddress({ ...newAddress, recipient_phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={newAddress.address_line}
                        onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                        <input
                          type="text"
                          value={newAddress.province}
                          onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.variantId} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">SKU: {item.variantSku} × {item.qty}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
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
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span>Rp {shippingCost.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>Rp {total.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

