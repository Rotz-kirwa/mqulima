import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { shopProducts, type ShopProduct } from "./shop-data";

export type CartItem = {
  product: ShopProduct;
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: ShopProduct, quantity?: number, sizeName?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  buyNow: (product: ShopProduct, sizeName?: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => [
    { product: shopProducts[0], quantity: 2 }, // Sukuma Wiki
    { product: shopProducts[3], quantity: 1 }  // Avocado (Hass)
  ]);

  const [cartOpen, setCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on client-side mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mqulima_cart");
      if (saved) {
        try {
          setCartItems(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse cart from localStorage", e);
        }
      }
    }
  }, []);

  // Save to localStorage when cart items change
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      localStorage.setItem("mqulima_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  const addToCart = (product: ShopProduct, quantity = 1, sizeName?: string) => {
    let targetId = product.id;
    let targetName = product.name;
    let targetPrice = product.price;
    let targetUnit = product.unit;

    if (sizeName && product.sizes) {
      const selected = product.sizes.find(s => s.name === sizeName);
      if (selected) {
        targetId = `${product.id}-${sizeName}`;
        targetName = `${product.name} (${sizeName})`;
        targetPrice = selected.price;
        targetUnit = `/${selected.name}`;
      }
    }

    const cartProduct: ShopProduct = {
      ...product,
      id: targetId,
      name: targetName,
      price: targetPrice,
      unit: targetUnit,
    };

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === cartProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === cartProduct.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product: cartProduct, quantity }];
    });
    toast.success(`Added ${cartProduct.name} to cart!`);
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    toast.info("Item removed from cart");
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: quantity }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const buyNow = (product: ShopProduct, sizeName?: string) => {
    let targetId = product.id;
    let targetName = product.name;
    let targetPrice = product.price;
    let targetUnit = product.unit;

    if (sizeName && product.sizes) {
      const selected = product.sizes.find(s => s.name === sizeName);
      if (selected) {
        targetId = `${product.id}-${sizeName}`;
        targetName = `${product.name} (${sizeName})`;
        targetPrice = selected.price;
        targetUnit = `/${selected.name}`;
      }
    }

    const cartProduct: ShopProduct = {
      ...product,
      id: targetId,
      name: targetName,
      price: targetPrice,
      unit: targetUnit,
    };

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === cartProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === cartProduct.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: cartProduct, quantity: 1 }];
    });
    setCartOpen(true);
    toast.success(`Selected ${cartProduct.name} for immediate checkout!`);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        buyNow,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
