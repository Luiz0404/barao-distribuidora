import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("barao_cart") || "[]"); } catch { return []; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("barao_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) return prev.map((i) => i.id === product.id ? { ...i, ...product, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho`, { duration: 1800 });
  };
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const incItem = (id) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  const decItem = (id) => setItems((prev) => prev.flatMap((i) => i.id === id ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i]));
  const clear = () => setItems([]);

  const priceOf = (i) => (i.promo_price && i.promo_price > 0) ? i.promo_price : i.price;
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + priceOf(i) * i.qty, 0);

  const value = useMemo(() => ({ items, open, setOpen, addItem, removeItem, incItem, decItem, clear, count, total, priceOf }), [items, open, count, total]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
