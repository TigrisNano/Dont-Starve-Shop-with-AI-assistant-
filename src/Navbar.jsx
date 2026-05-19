import React, { useEffect, useState } from "react";
import "./Navbar.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useCart } from "./CartContext";

function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [balance, setBalance] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount } = useCart();
  const { logout: cartLogout } = useCart();

  const fetchBalance = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.user_id;

      fetch(`http://localhost:3001/api/users/${userId}/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.balance !== "undefined") {
            setBalance(data.balance);
          }
        })
        .catch((err) => console.error("Помилка отримання балансу:", err));
    } catch (err) {
      console.error("JWT decode error:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role_id");

    setIsAuthenticated(!!token);
    setUsername(storedUsername || "");
    setRole(storedRole || "");

    fetchBalance();
  }, [location]);

  useEffect(() => {
    window.addEventListener("updateBalance", fetchBalance);
    return () => {
      window.removeEventListener("updateBalance", fetchBalance);
    };
  }, []);

  const handleLogout = () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        const userId = decoded.user_id;
        localStorage.removeItem(`cart_${userId}`);
      }
    } catch (err) {
      console.error("JWT decode error:", err);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role_id");

    setIsAuthenticated(false);
    setUsername("");
    setRole("");
    setBalance(0);

    cartLogout();
    navigate("/login");
  };

  useEffect(() => {
    const handleUsernameChange = () => {
      const newUsername = localStorage.getItem("username") || "";
      const newRole = localStorage.getItem("role_id") || "";
      setUsername(newUsername);
      setRole(newRole);
    };

    window.addEventListener("usernameChanged", handleUsernameChange);
    return () => {
      window.removeEventListener("usernameChanged", handleUsernameChange);
    };
  }, []);

  return (
    <nav className="navbar">
      <h1 className="navbar-title">
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          Survivalist Shop
        </Link>
      </h1>
      <div className="navbar-buttons">
        <button onClick={() => navigate("/")}>Catalog</button>

        {isAuthenticated && (role === "2" || role === "1") && (
          <button onClick={() => navigate("/admin")}>Admin Panel</button>
        )}

        {isAuthenticated ? (
          <>
            <button onClick={() => navigate("/cart")}>
              Cart {totalCount > 0 ? `(${totalCount})` : ""}
            </button>
            <button onClick={() => navigate("/delivery")}>Orders</button>
            <button onClick={() => navigate("/profile")}>
              Profile: {username}
            </button>
            <button onClick={() => navigate("/wallet")}>
              Balance: {balance} gold
            </button>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <button onClick={() => navigate("/login")}>Login</button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
