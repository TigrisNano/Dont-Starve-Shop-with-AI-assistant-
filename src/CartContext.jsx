import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        setUserId(decoded.user_id || null);
      } else {
        setUserId(null);
      }
    } catch {
      setUserId(null);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!userId) {
      setItems([]);
      return;
    }
    try {
      const raw = localStorage.getItem(`cart_${userId}`);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, [userId, isReady]);

  useEffect(() => {
    if (!userId || !isReady) return;
    localStorage.setItem(`cart_${userId}`, JSON.stringify(items));
  }, [items, userId, isReady]);

  const addItem = (product, quantity = 1) => {
    const key = `${product.category}:${product.id}`;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
        return copy;
      }
      return [...prev, { ...product, key, quantity }];
    });
  };

  const removeItem = (key) =>
    setItems((prev) => prev.filter((i) => i.key !== key));
  const updateQty = (key, quantity) =>
    setItems((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, quantity: Math.max(1, quantity) } : i
      )
    );
  const clearCart = () => setItems([]);

  const logout = () => {
    if (userId) {
      localStorage.removeItem(`cart_${userId}`);
    }
    localStorage.removeItem("token");
    setItems([]);
    setUserId(null);
  };

  const totalCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        userId,
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        logout,
        totalCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
