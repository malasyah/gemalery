import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { Navigation } from "../components/Navigation.js";
import { useAuth } from "../contexts/AuthContext.js";

type Address = {
  id: string;
  label?: string | null;
  recipient_name: string;
  recipient_phone: string;
  address_line: string;
  city?: string | null;
  province?: string | null;
  subdistrict?: string | null;
  postal_code?: string | null;
  is_default: boolean;
};

export function Account() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    label: "",
    recipient_name: "",
    recipient_phone: "",
    address_line: "",
    city: "",
    province: "",
    subdistrict: "",
    postal_code: "",
    is_default: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadProfile();
    loadAddresses();
  }, [user, navigate]);

  async function loadProfile() {
    if (!user?.id) return;
    try {
      // User data already has name, email, phone from /auth/me
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  }

  async function loadAddresses() {
    if (!user?.id) return;
    try {
      const addrs = await api<Address[]>(`/users/${user.id}/addresses`);
      setAddresses(addrs || []);
    } catch (error) {
      console.error("Failed to load addresses:", error);
    }
  }

  async function updateProfile() {
    if (!user?.id) return;
    try {
      await api(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone || null,
          email: profile.email || null,
        }),
      });
      alert("Profile updated successfully");
      await loadProfile();
    } catch (error: any) {
      alert("Failed to update profile: " + (error.message || "Unknown error"));
    }
  }

  async function addAddress() {
    if (!user?.id) return;
    if (!newAddress.recipient_name || !newAddress.recipient_phone || !newAddress.address_line) {
      alert("Please fill in all required fields");
      return;
    }
    try {
      await api(`/users/${user.id}/addresses`, {
        method: "POST",
        body: JSON.stringify(newAddress),
      });
      setNewAddress({
        label: "",
        recipient_name: "",
        recipient_phone: "",
        address_line: "",
        city: "",
        province: "",
        subdistrict: "",
        postal_code: "",
        is_default: false,
      });
      await loadAddresses();
    } catch (error: any) {
      alert("Failed to add address: " + (error.message || "Unknown error"));
    }
  }

  async function updateAddress(addressId: string) {
    if (!user?.id) return;
    const addr = addresses.find(a => a.id === addressId);
    if (!addr) return;
    try {
      await api(`/users/${user.id}/addresses/${addressId}`, {
        method: "PATCH",
        body: JSON.stringify(newAddress),
      });
      setEditingAddress(null);
      setNewAddress({
        label: "",
        recipient_name: "",
        recipient_phone: "",
        address_line: "",
        city: "",
        province: "",
        subdistrict: "",
        postal_code: "",
        is_default: false,
      });
      await loadAddresses();
    } catch (error: any) {
      alert("Failed to update address: " + (error.message || "Unknown error"));
    }
  }

  async function deleteAddress(addressId: string) {
    if (!user?.id) return;
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await api(`/users/${user.id}/addresses/${addressId}`, {
        method: "DELETE",
      });
      await loadAddresses();
    } catch (error: any) {
      alert("Failed to delete address: " + (error.message || "Unknown error"));
    }
  }

  async function setDefaultAddress(addressId: string) {
    if (!user?.id) return;
    try {
      await api(`/users/${user.id}/addresses/${addressId}/default`, {
        method: "POST",
      });
      await loadAddresses();
    } catch (error: any) {
      alert("Failed to set default address: " + (error.message || "Unknown error"));
    }
  }

  function startEditAddress(addr: Address) {
    setEditingAddress(addr.id);
    setNewAddress({
      label: addr.label || "",
      recipient_name: addr.recipient_name,
      recipient_phone: addr.recipient_phone,
      address_line: addr.address_line,
      city: addr.city || "",
      province: addr.province || "",
      subdistrict: addr.subdistrict || "",
      postal_code: addr.postal_code || "",
      is_default: addr.is_default,
    });
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Profile Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={updateProfile}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                >
                  Update Profile
                </button>
              </div>
            </div>

            {/* Addresses Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Addresses ({addresses.length}/5)</h2>

              {/* Add New Address Form */}
              {addresses.length < 5 && (
                <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Label (optional)"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Recipient Name *"
                      value={newAddress.recipient_name}
                      onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Recipient Phone *"
                      value={newAddress.recipient_phone}
                      onChange={(e) => setNewAddress({ ...newAddress, recipient_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <textarea
                      placeholder="Address Line *"
                      value={newAddress.address_line}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Province"
                        value={newAddress.province}
                        onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAddress.is_default}
                        onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-700">Set as default address</label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (editingAddress) {
                            updateAddress(editingAddress);
                          } else {
                            addAddress();
                          }
                        }}
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition text-sm"
                      >
                        {editingAddress ? "Update" : "Add"} Address
                      </button>
                      {editingAddress && (
                        <button
                          onClick={() => {
                            setEditingAddress(null);
                            setNewAddress({
                              label: "",
                              recipient_name: "",
                              recipient_phone: "",
                              address_line: "",
                              city: "",
                              province: "",
                              subdistrict: "",
                              postal_code: "",
                              is_default: false,
                            });
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Address List */}
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 border-2 rounded-lg ${
                      addr.is_default ? "border-indigo-600 bg-indigo-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {addr.is_default && (
                          <span className="inline-block bg-indigo-600 text-white text-xs px-2 py-1 rounded mb-2">
                            Default
                          </span>
                        )}
                        {addr.label && <p className="font-medium text-gray-900">{addr.label}</p>}
                        <p className="font-medium text-gray-900">{addr.recipient_name}</p>
                        <p className="text-sm text-gray-600">{addr.recipient_phone}</p>
                        <p className="text-sm text-gray-700 mt-1">{addr.address_line}</p>
                        {addr.city && <p className="text-sm text-gray-600">{addr.city}</p>}
                      </div>
                      <div className="flex gap-2">
                        {!addr.is_default && (
                          <button
                            onClick={() => setDefaultAddress(addr.id)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => startEditAddress(addr)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAddress(addr.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

