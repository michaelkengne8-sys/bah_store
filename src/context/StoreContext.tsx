import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import type React from "react";
import { products as catalogProducts } from "../lib/productStore";
import type { StoreState, StoreAction, StoreContextValue, Toast, ShippingAddress, PaymentInfo, CheckoutStep, RecentlyViewedItem } from "../types";

const StoreContext = createContext<StoreContextValue | null>(null);

const STORAGE_KEY = "tse-store-state";

const initialState: StoreState = {
  cart: [],
  wishlist: [],
  compare: [],
  recentlyViewed: [],
  toasts: [],
  modal: null,
  search: "",
  compareOpen: false,
  checkoutStep: "shipping",
  shippingAddress: null,
  paymentInfo: null,
};

function loadFromStorage(): StoreState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      cart: parsed.cart ?? [],
      wishlist: parsed.wishlist ?? [],
      compare: parsed.compare ?? [],
      recentlyViewed: parsed.recentlyViewed ?? [],
    };
  } catch {
    return initialState;
  }
}

function saveToStorage(state: StoreState) {
  if (typeof window === "undefined") return;
  try {
    const toPersist = {
      cart: state.cart,
      wishlist: state.wishlist,
      compare: state.compare,
      recentlyViewed: state.recentlyViewed,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch {
    // Ignore quota/private mode errors
  }
}

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existing = state.cart.find(
        (i) => i.id === action.payload.id && i.color === action.payload.color
      );
      const cart = existing
        ? state.cart.map((i) =>
            i.id === action.payload.id && i.color === action.payload.color
              ? { ...i, qty: i.qty + (action.payload.qty ?? 1) }
              : i
          )
        : [...state.cart, { id: action.payload.id, qty: action.payload.qty ?? 1, color: action.payload.color }];
      return { ...state, cart };
    }
    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((i) => !(i.id === action.payload.id && i.color === action.payload.color)),
      };
    case "UPDATE_QTY":
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.id === action.payload.id && i.color === action.payload.color
            ? { ...i, qty: Math.max(1, action.payload.qty) }
            : i
        ),
      };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "TOGGLE_WISHLIST": {
      const isIn = state.wishlist.some((w) => w.id === action.payload.id);
      return {
        ...state,
        wishlist: isIn
          ? state.wishlist.filter((w) => w.id !== action.payload.id)
          : [...state.wishlist, { id: action.payload.id }],
      };
    }
    case "TOGGLE_COMPARE": {
      const isIn = state.compare.some((c) => c.id === action.payload.id);
      const next = isIn
        ? state.compare.filter((c) => c.id !== action.payload.id)
        : state.compare.length >= 4
        ? state.compare
        : [...state.compare, { id: action.payload.id }];
      return { ...state, compare: next };
    }
    case "CLEAR_COMPARE":
      return { ...state, compare: [], compareOpen: false };
    case "TOGGLE_COMPARE_DRAWER":
      return { ...state, compareOpen: !state.compareOpen };
    case "PUSH_TOAST":
      return { ...state, toasts: [...state.toasts, action.payload] };
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload.id) };
    case "OPEN_MODAL":
      return { ...state, modal: action.payload };
    case "CLOSE_MODAL":
      return { ...state, modal: null };
    case "SET_SEARCH":
      return { ...state, search: action.payload };
    case "PUSH_RECENTLY_VIEWED": {
      const item = action.payload;
      const next = [
        item,
        ...state.recentlyViewed.filter((rv) => rv.id !== item.id),
      ].slice(0, 8) as RecentlyViewedItem[];
      return { ...state, recentlyViewed: next };
    }
    case "SET_CHECKOUT_STEP":
      return { ...state, checkoutStep: action.payload };
    case "SET_SHIPPING_ADDRESS":
      return { ...state, shippingAddress: action.payload };
    case "SET_PAYMENT_INFO":
      return { ...state, paymentInfo: action.payload };
    case "CLEAR_CHECKOUT":
      return { ...state, checkoutStep: "shipping", shippingAddress: null, paymentInfo: null };
    default:
      return state;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrated = true;
  const [state, dispatch] = useReducer(reducer, initialState, loadFromStorage);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const pushToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    dispatch({ type: "PUSH_TOAST", payload: { id, message, type } });
    setTimeout(() => dispatch({ type: "DISMISS_TOAST", payload: { id } }), 3200);
  }, []);

  const addToCart = useCallback(
    (id: string, qty = 1, color?: string) => {
      const selectedProduct = catalogProducts.find((p) => p.id === id);
      dispatch({ type: "ADD_TO_CART", payload: { id, qty, color: color ?? selectedProduct?.colors?.[0] ?? "" } });
      const displayTitle = selectedProduct?.title ?? "Product";
      pushToast(`${displayTitle.split(" ").slice(0, 3).join(" ")}… added to cart`, "success");
    },
    [pushToast]
  );

  const setCheckoutStep = useCallback((step: CheckoutStep) => {
    dispatch({ type: "SET_CHECKOUT_STEP", payload: step });
  }, []);

  const setShippingAddress = useCallback((addr: ShippingAddress) => {
    dispatch({ type: "SET_SHIPPING_ADDRESS", payload: addr });
  }, []);

  const setPaymentInfo = useCallback((info: PaymentInfo) => {
    dispatch({ type: "SET_PAYMENT_INFO", payload: info });
  }, []);

  const clearCheckout = useCallback(() => {
    dispatch({ type: "CLEAR_CHECKOUT" });
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      dispatch,
      addToCart,
      pushToast,
      hydrated,
      checkoutStep: state.checkoutStep,
      setCheckoutStep,
      shippingAddress: state.shippingAddress,
      setShippingAddress,
      paymentInfo: state.paymentInfo,
      setPaymentInfo,
      clearCheckout,
    }),
    [state, addToCart, pushToast, hydrated, setCheckoutStep, setShippingAddress, setPaymentInfo, clearCheckout]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}