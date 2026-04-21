import { createContext, useContext, useEffect, useState } from "react";

const CART_STORAGE_KEY = "fozorewor-cart-v1";
const TAX_RATE = 0.08;
const DELIVERY_FEE_CENTS = 499;
const FREE_DELIVERY_THRESHOLD_CENTS = 3500;

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );

  const value = {
    items,
    itemCount,
    subtotalCents,
    addItem(product, quantity = 1) {
      const nextQuantity = normalizeQuantity(quantity);

      setItems((currentItems) => {
        const existingIndex = currentItems.findIndex(
          (item) => item.productId === product.id,
        );

        if (existingIndex === -1) {
          return [...currentItems, toCartItem(product, nextQuantity)];
        }

        return currentItems.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + nextQuantity }
            : item,
        );
      });
    },
    updateQuantity(productId, quantity) {
      const nextQuantity = normalizeQuantity(quantity);

      setItems((currentItems) =>
        currentItems.flatMap((item) => {
          if (item.productId !== productId) return [item];
          if (nextQuantity <= 0) return [];
          return [{ ...item, quantity: nextQuantity }];
        }),
      );
    },
    removeItem(productId) {
      setItems((currentItems) =>
        currentItems.filter((item) => item.productId !== productId),
      );
    },
    getItemQuantity(productId) {
      return items.find((item) => item.productId === productId)?.quantity ?? 0;
    },
    clearCart() {
      setItems([]);
    },
    getSummary() {
      return calculateSummary(items);
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}

export function calculateSummary(items) {
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const deliveryFeeCents =
    subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS || subtotalCents === 0
      ? 0
      : DELIVERY_FEE_CENTS;

  return {
    subtotalCents,
    taxCents,
    deliveryFeeCents,
    totalCents: subtotalCents + taxCents + deliveryFeeCents,
  };
}

function loadCart() {
  try {
    const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!storedValue) return [];

    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && Number.isInteger(item.productId))
      .map((item) => ({
        ...item,
        quantity: normalizeQuantity(item.quantity),
        priceCents: Number(item.priceCents || 0),
      }));
  } catch {
    return [];
  }
}

function toCartItem(product, quantity) {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    unitLabel: product.unit_label || "1 unit",
    imagePath: product.image_path,
    priceCents: Number(product.price_cents || 0),
    quantity,
  };
}

function normalizeQuantity(quantity) {
  const parsedQuantity = Number.parseInt(quantity, 10);
  return Number.isInteger(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
}
