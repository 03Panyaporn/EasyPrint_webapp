"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCarts } from "@/lib/api/cart";

interface CartContextType {
  cartCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  // ยอดรวมจำนวนรายการในตะกร้าทุกร้าน — แหล่งเดียวที่ badge บน header ทุกหน้าอ่านค่า
  // guest/role อื่นที่ไม่ใช่ลูกค้าจะได้ 401/403 จาก /carts ถือว่าไม่มีตะกร้า ไม่ต้อง error ให้ user เห็น
  const refreshCart = useCallback(async () => {
    try {
      const { carts } = await getCarts();
      setCartCount(carts.reduce((sum, cart) => sum + cart.items.length, 0));
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}
