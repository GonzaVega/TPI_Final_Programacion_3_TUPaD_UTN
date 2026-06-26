import { getCurrentUser } from "../../../utils/localStorage";
import {
  clearCart,
  decrementCartItemQuantity,
  getCartItems,
  getCartItemsCount,
  getCartSubtotal,
  incrementCartItemQuantity,
  removeItemFromCart,
} from "../../../utils/cart/cartStorage";
import { CART_ICON } from "../../../utils/cart/cartIcon";
import type { IUser } from "../../../types/IUser";
import type { Order, OrderDetail } from "../../../types/order";
import type { CartItem } from "../../../types/cart";

const SHIPPING_COST: number = 500;
const ORDERS_KEY: string = "orders";

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

const loadLinks: () => void = () => {
  const linksList: HTMLElement | null = document.querySelector(".navbar-menu");
  if (!linksList) return;

  linksList.innerHTML = "";

  const homeLi: HTMLElement = document.createElement("li");
  homeLi.innerHTML = '<a href="/src/pages/store/home/home.html">Inicio</a>';
  linksList.appendChild(homeLi);

  const ordersLi: HTMLElement = document.createElement("li");
  ordersLi.innerHTML =
    '<a href="/src/pages/client/orders/orders.html">Mis Pedidos</a>';
  linksList.appendChild(ordersLi);

  const cartLi: HTMLElement = document.createElement("li");
  cartLi.className = "navbar-cart-item";
  cartLi.innerHTML = `
    <a href="/src/pages/store/cart/cart.html" class="navbar-cart-link" aria-label="Carrito de supermercado">
      <span class="navbar-cart-icon">${CART_ICON}</span>
      <span class="navbar-cart-badge" data-cart-badge aria-live="polite"></span>
    </a>
  `;
  linksList.appendChild(cartLi);

  const adminLink: HTMLElement = document.createElement("li");
  const user: IUser | null = getCurrentUser();
  if (user?.role === "admin") {
    adminLink.innerHTML =
      '<a href="/src/pages/admin/adminHome/adminHome.html"><strong>Panel Admin</strong></a>';
    linksList.appendChild(adminLink);
  }

  const logoutLi: HTMLElement = document.createElement("li");
  logoutLi.innerHTML = '<a href="#" id="logout-link">Cerrar Sesión</a>';
  linksList.appendChild(logoutLi);
};

const syncCartBadge: () => void = () => {
  const badge: HTMLElement | null =
    document.querySelector<HTMLElement>("[data-cart-badge]");
  if (!badge) return;

  const count: number = getCartItemsCount();
  badge.textContent = String(count);
  badge.hidden = count === 0;
};

const renderSummary: () => void = () => {
  const subtotalEl: HTMLElement | null = document.querySelector<HTMLElement>(
    "[data-summary-subtotal]",
  );
  const shippingEl: HTMLElement | null = document.querySelector<HTMLElement>(
    "[data-summary-shipping]",
  );
  const totalEl: HTMLElement | null = document.querySelector<HTMLElement>(
    "[data-summary-total]",
  );
  const checkoutBtn: HTMLButtonElement | null = document.getElementById(
    "checkout-btn",
  ) as HTMLButtonElement | null;
  const clearCartBtn: HTMLButtonElement | null = document.getElementById(
    "clear-cart-btn",
  ) as HTMLButtonElement | null;

  if (!subtotalEl || !shippingEl || !totalEl) return;

  const subtotal: number = getCartSubtotal();
  const shipping: number = subtotal > 0 ? SHIPPING_COST : 0;
  const total: number = subtotal + shipping;

  subtotalEl.textContent = formatCurrency(subtotal);
  shippingEl.textContent = formatCurrency(shipping);
  totalEl.textContent = formatCurrency(total);

  if (checkoutBtn) {
    checkoutBtn.disabled = subtotal <= 0;
  }

  if (clearCartBtn) {
    clearCartBtn.disabled = subtotal <= 0;
  }
};

const renderEmptyState: (container: HTMLElement) => void = (
  container: HTMLElement,
) => {
  const empty: HTMLParagraphElement = document.createElement("p");
  empty.className = "cart-empty";
  empty.innerHTML =
    'Tu carrito está vacío. <a href="/src/pages/store/home/home.html">Ver catálogo</a>';
  container.appendChild(empty);
};

const renderCartItems: () => void = () => {
  const itemsContainer: HTMLElement | null =
    document.querySelector<HTMLElement>("[data-cart-items]");
  if (!itemsContainer) return;

  itemsContainer.innerHTML = "";

  const items = getCartItems();
  if (items.length === 0) {
    renderEmptyState(itemsContainer);
    return;
  }

  items.forEach((item) => {
    const card: HTMLElement = document.createElement("article");
    card.className = "cart-item";

    card.innerHTML = `
      <img src="${item.product.imagen}" alt="${item.product.nombre}" />
      <div class="cart-item-details">
        <h4>${item.product.nombre}</h4>
        <p>${item.product.descripcion}</p>
        <strong>${formatCurrency(item.product.precio)} c/u</strong>
      </div>
      <div class="cart-item-actions">
        <button type="button" data-action="decrement">-</button>
        <span>${item.quantity}</span>
        <button type="button" data-action="increment">+</button>
      </div>
      <strong class="cart-item-subtotal">${formatCurrency(item.product.precio * item.quantity)}</strong>
      <button type="button" class="danger small" data-action="remove">Eliminar</button>
    `;

    const decrementBtn: HTMLButtonElement | null =
      card.querySelector<HTMLButtonElement>('[data-action="decrement"]');
    const incrementBtn: HTMLButtonElement | null =
      card.querySelector<HTMLButtonElement>('[data-action="increment"]');
    const removeBtn: HTMLButtonElement | null =
      card.querySelector<HTMLButtonElement>('[data-action="remove"]');

    decrementBtn?.addEventListener("click", () => {
      decrementCartItemQuantity(item.product.id);
      renderAll();
    });

    incrementBtn?.addEventListener("click", () => {
      incrementCartItemQuantity(item.product.id);
      renderAll();
    });

    removeBtn?.addEventListener("click", () => {
      removeItemFromCart(item.product.id);
      renderAll();
    });

    itemsContainer.appendChild(card);
  });
};

const getOrders: () => Order[] = () => {
  const raw: string | null = localStorage.getItem(ORDERS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
};

const saveOrders: (orders: Order[]) => void = (orders: Order[]) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

const openCheckoutModal: () => void = () => {
  const user: IUser | null = getCurrentUser();
  const items: CartItem[] = getCartItems();
  if (!user || items.length === 0) return;

  const subtotal: number = getCartSubtotal();
  const shipping: number = SHIPPING_COST;
  const total: number = subtotal + shipping;

  const overlay: HTMLElement = document.createElement("div");
  overlay.className = "modal-overlay checkout-modal";

  overlay.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="Checkout">
      <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
      <h2>Confirmar Pedido</h2>
      <form id="checkout-form">
        <div class="checkout-user-info">
          <p><strong>Cliente:</strong> ${user.firstName ?? ""} ${user.lastName ?? ""}</p>
          <p><strong>Email:</strong> ${user.email}</p>
        </div>
        <label for="checkout-phone">Teléfono *</label>
        <input type="tel" id="checkout-phone" value="${user.phone ?? ""}" required />

        <label for="checkout-payment">Forma de pago *</label>
        <select id="checkout-payment" required>
          <option value="">Seleccionar...</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Tarjeta de crédito">Tarjeta de crédito</option>
          <option value="Tarjeta de débito">Tarjeta de débito</option>
          <option value="Mercado Pago">Mercado Pago</option>
        </select>

        <div class="checkout-totals">
          <div class="checkout-total-line">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class="checkout-total-line">
            <span>Envío:</span>
            <span>$${shipping.toFixed(2)}</span>
          </div>
          <div class="checkout-total-line checkout-total-final">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="checkout-actions">
          <button type="submit" class="checkout-confirm">Confirmar Pedido</button>
          <button type="button" class="checkout-cancel danger">Cancelar</button>
        </div>
        <p id="checkout-feedback" class="checkout-feedback" hidden>Pedido confirmado. Redirigiendo...</p>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const closeModal: () => void = () => {
    overlay.remove();
    document.body.style.overflow = "";
  };

  overlay
    .querySelector<HTMLButtonElement>(".modal-close")
    ?.addEventListener("click", closeModal);

  overlay
    .querySelector<HTMLButtonElement>(".checkout-cancel")
    ?.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  const form: HTMLFormElement | null =
    overlay.querySelector<HTMLFormElement>("#checkout-form");
  const feedbackEl: HTMLElement | null =
    overlay.querySelector<HTMLElement>("#checkout-feedback");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const phoneInput: HTMLInputElement | null =
      overlay.querySelector<HTMLInputElement>("#checkout-phone");
    const paymentSelect: HTMLSelectElement | null =
      overlay.querySelector<HTMLSelectElement>("#checkout-payment");

    const telefono: string = phoneInput?.value.trim() ?? "";
    const formaPago: string = paymentSelect?.value ?? "";

    if (!telefono || !formaPago) return;

    const detalles: OrderDetail[] = items.map((item) => ({
      idProducto: item.product.id,
      cantidad: item.quantity,
      subtotal: item.product.precio * item.quantity,
    }));

    const newOrder: Order = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      estado: "PENDIENTE",
      total,
      formaPago,
      telefono,
      idUsuario: user.id,
      detalles,
    };

    const existingOrders: Order[] = getOrders();
    existingOrders.push(newOrder);
    saveOrders(existingOrders);
    clearCart();

    if (feedbackEl) feedbackEl.hidden = false;
    const submitBtn: HTMLButtonElement | null =
      overlay.querySelector<HTMLButtonElement>(".checkout-confirm");
    if (submitBtn) submitBtn.disabled = true;

    setTimeout(() => {
      window.location.href = "/src/pages/client/orders/orders.html";
    }, 1500);
  });
};

const setupActions: () => void = () => {
  const checkoutBtn: HTMLElement | null =
    document.getElementById("checkout-btn");
  const clearCartBtn: HTMLElement | null =
    document.getElementById("clear-cart-btn");

  checkoutBtn?.addEventListener("click", openCheckoutModal);

  clearCartBtn?.addEventListener("click", () => {
    clearCart();
    renderAll();
  });
};

const renderAll: () => void = () => {
  renderCartItems();
  renderSummary();
  syncCartBadge();
};

loadLinks();
setupActions();
renderAll();
