import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Package, Mail, ShoppingCart, User, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.js";

export function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Get cart items count from localStorage
  const getCartCount = () => {
    try {
      const cart = localStorage.getItem("cart");
      if (!cart) return 0;
      const items = JSON.parse(cart);
      return items.length;
    } catch {
      return 0;
    }
  };
  
  const [cartCount, setCartCount] = React.useState(getCartCount());
  
  // Update cart count when storage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      setCartCount(getCartCount());
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Also check periodically for same-tab updates
    const interval = setInterval(handleStorageChange, 500);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-800">Gemalery</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/home" className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition">
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link to="/products" className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition">
              <Package size={20} />
              <span>Products</span>
            </Link>
            <Link to="/contact" className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition">
              <Mail size={20} />
              <span>Contact Us</span>
            </Link>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link to="/cart" className="relative flex items-center text-gray-700 hover:text-gray-900 transition">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Account/Login */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link to="/account" className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition">
                  <User size={24} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition"
                  title="Logout"
                >
                  <LogOut size={24} />
                </button>
              </div>
            ) : (
              <Link to="/" className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition">
                <LogIn size={24} />
                <span className="hidden md:inline">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

