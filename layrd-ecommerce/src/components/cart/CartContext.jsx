"use client";
// ─────────────────────────────────────────────
// LÄYRD – Cart Context
// Manages cart state globally using React Context
// ─────────────────────────────────────────────
import { createContext, useContext, useReducer, useEffect } from "react";

const CartContext = createContext(null);

// Cart item shape:
// { id, name, flavourId?, size?, price, quantity, image?, type: 'can'|'espresso'|'bundle', sweetness? }

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id
              ? { ...i, quantity: i.quantity + (action.item.quantity || 1) }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, quantity: action.item.quantity || 1 }],
      };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case "UPDATE_QUANTITY":
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      };

    case "CLEAR_CART":
      return { ...state, items: [] };

    case "SET_PROMO":
      return { ...state, promoCode: action.promoCode };

    case "REMOVE_PROMO":
      return { ...state, promoCode: null };

    case "SET_DELIVERY_METHOD":
      return { ...state, deliveryMethod: action.method }; // 'pickup' | 'delivery'

    case "SET_DELIVERY_FEE":
      return { ...state, deliveryFee: action.fee };

    case "LOAD_CART":
      return action.cart;

    case "OPEN_CART":
      return { ...state, isCartOpen: true };

    case "CLOSE_CART":
      return { ...state, isCartOpen: false };

    case "TOGGLE_CART":
      return { ...state, isCartOpen: !state.isCartOpen };

    default:
      return state;
  }
}

const initialState = {
  items: [],
  promoCode: null,
  deliveryMethod: "pickup", // 'pickup' | 'delivery'
  deliveryFee: 0,
  isCartOpen: false,
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("layrd_cart");
      if (saved) {
        dispatch({ type: "LOAD_CART", cart: JSON.parse(saved) });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("layrd_cart", JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }, [state]);

  // Derived values
  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Minimum 4 items for delivery eligibility
  const meetsDeliveryMinimum = totalItems >= 4;

  return (
    <CartContext.Provider
      value={{
        ...state,
        totalItems,
        subtotal,
        meetsDeliveryMinimum,
        dispatch,
        addItem: (item) => dispatch({ type: "ADD_ITEM", item }),
        removeItem: (id) => dispatch({ type: "REMOVE_ITEM", id }),
        updateQuantity: (id, quantity) =>
          dispatch({ type: "UPDATE_QUANTITY", id, quantity }),
        clearCart: () => dispatch({ type: "CLEAR_CART" }),
        setPromo: (promoCode) => dispatch({ type: "SET_PROMO", promoCode }),
        removePromo: () => dispatch({ type: "REMOVE_PROMO" }),
        setDeliveryMethod: (method) =>
          dispatch({ type: "SET_DELIVERY_METHOD", method }),
        setDeliveryFee: (fee) => dispatch({ type: "SET_DELIVERY_FEE", fee }),
        openCart: () => dispatch({ type: "OPEN_CART" }),
        closeCart: () => dispatch({ type: "CLOSE_CART" }),
        toggleCart: () => dispatch({ type: "TOGGLE_CART" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
