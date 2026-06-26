import type { Product } from "../../types/product";
import type { CartItem } from "../../types/cart";
import { getCurrentUser } from "../localStorage";

const CART_KEY_PREFIX: string = "cart:user:";

function getActiveCartKey(): string | null {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  return `${CART_KEY_PREFIX}${user.id}`;
}

function readCartItems(): CartItem[] {
  const cartKey: string | null = getActiveCartKey();
  if (!cartKey) {
    return [];
  }

  const raw: string | null = localStorage.getItem(cartKey);

  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as CartItem[];
  } catch {
    console.error("Error parseando carrito desde localStorage:", raw);
    return [];
  }
}

function saveCartItems(items: CartItem[]): void {
  const cartKey: string | null = getActiveCartKey();
  if (!cartKey) {
    return;
  }

  localStorage.setItem(cartKey, JSON.stringify(items));
}

export function getCartItems(): CartItem[] {
  return readCartItems();
}

export function addProductToCart(product: Product, quantity: number = 1): CartItem[] {
  const cartItems: CartItem[] = readCartItems();
  const existingItem: CartItem | undefined = cartItems.find(
    (item) => item.product.id === product.id,
  );

  const currentQty = existingItem ? existingItem.quantity : 0;
  const newQty = currentQty + quantity;
  if (newQty > product.stock) return cartItems;

  if (existingItem) {
    existingItem.quantity = newQty;
  } else {
    cartItems.push({ product, quantity });
  }

  saveCartItems(cartItems);
  return cartItems;
}

export function getCartItemsCount(): number {
  return readCartItems().reduce((total, item) => total + item.quantity, 0);
}

export function incrementCartItemQuantity(productId: number): CartItem[] {
  const cartItems: CartItem[] = readCartItems();
  const item: CartItem | undefined = cartItems.find(
    (cartItem) => cartItem.product.id === productId,
  );

  if (!item) {
    return cartItems;
  }

  if (item.quantity >= item.product.stock) return cartItems;

  item.quantity += 1;
  saveCartItems(cartItems);
  return cartItems;
}

export function decrementCartItemQuantity(productId: number): CartItem[] {
  const cartItems: CartItem[] = readCartItems();
  const item: CartItem | undefined = cartItems.find(
    (cartItem) => cartItem.product.id === productId,
  );

  if (!item) {
    return cartItems;
  }

  item.quantity -= 1;

  const filteredItems: CartItem[] = cartItems.filter(
    (cartItem) => cartItem.quantity > 0,
  );
  saveCartItems(filteredItems);
  return filteredItems;
}

export function removeItemFromCart(productId: number): CartItem[] {
  const cartItems: CartItem[] = readCartItems();
  const filteredItems: CartItem[] = cartItems.filter(
    (item) => item.product.id !== productId,
  );
  saveCartItems(filteredItems);
  return filteredItems;
}

export function clearCart(): void {
  const cartKey: string | null = getActiveCartKey();
  if (!cartKey) {
    return;
  }

  localStorage.removeItem(cartKey);
}

export function getCartSubtotal(): number {
  return readCartItems().reduce(
    (subtotal, item) => subtotal + item.product.precio * item.quantity,
    0,
  );
}
