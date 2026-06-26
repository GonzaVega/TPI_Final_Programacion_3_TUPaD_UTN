import { getCurrentUser } from "../../../utils/localStorage";
import { fetchJson } from "../../../utils/fetchJson";
import { CART_ICON } from "../../../utils/cart/cartIcon";
import type { IUser } from "../../../types/IUser";
import type { Order } from "../../../types/order";
import type { Product } from "../../../types/product";

const ORDERS_KEY: string = "orders";

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "#f59e0b",
  CONFIRMADO: "#3b82f6",
  TERMINADO: "#22c55e",
  CANCELADO: "#ef4444",
};

const loadLinks: (user: IUser | null) => void = (user: IUser | null) => {
  const linksList: HTMLElement | null = document.querySelector(".navbar-menu");
  if (!linksList) return;

  linksList.innerHTML = "";

  const homeLi: HTMLElement = document.createElement("li");
  homeLi.innerHTML =
    '<a href="/src/pages/store/home/home.html">Inicio</a>';
  linksList.appendChild(homeLi);

  const ordersLi: HTMLElement = document.createElement("li");
  ordersLi.innerHTML =
    '<a href="/src/pages/client/orders/orders.html"><strong>Mis Pedidos</strong></a>';
  linksList.appendChild(ordersLi);

  const cartLi: HTMLElement = document.createElement("li");
  cartLi.className = "navbar-cart-item";
  cartLi.innerHTML = `
    <a href="/src/pages/store/cart/cart.html" class="navbar-cart-link" aria-label="Carrito de supermercado">
      <span class="navbar-cart-icon">${CART_ICON}</span>
    </a>
  `;
  linksList.appendChild(cartLi);

  if (user?.role === "admin") {
    const adminLi: HTMLElement = document.createElement("li");
    adminLi.innerHTML =
      '<a href="/src/pages/admin/adminHome/adminHome.html"><strong>Panel Admin</strong></a>';
    linksList.appendChild(adminLi);
  }

  const logoutLi: HTMLElement = document.createElement("li");
  logoutLi.innerHTML = '<a href="#" id="logout-link">Cerrar Sesión</a>';
  linksList.appendChild(logoutLi);
};

const getOrdersFromStorage: () => Order[] = () => {
  const raw: string | null = localStorage.getItem(ORDERS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
};

const formatDate: (iso: string) => string = (iso: string) => {
  const d: Date = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderModal: (order: Order, products: Product[]) => void = (
  order: Order,
  products: Product[],
) => {
  const overlay: HTMLElement = document.createElement("div");
  overlay.className = "modal-overlay";

  const detailsHtml: string = order.detalles
    .map((d) => {
      const product: Product | undefined = products.find(
        (p) => p.id === d.idProducto,
      );
      const name: string = product?.nombre ?? `Producto #${d.idProducto}`;
      return `
        <div class="order-modal-detail-row">
          <span>${name}</span>
          <span>x${d.cantidad}</span>
          <span>$${d.subtotal.toFixed(2)}</span>
        </div>`;
    })
    .join("");

  const subtotal: number = order.detalles.reduce(
    (sum, d) => sum + d.subtotal,
    0,
  );
  const shipping: number = order.total - subtotal;

  overlay.innerHTML = `
    <div class="modal-content order-modal-content" role="dialog" aria-modal="true" aria-label="Detalle del pedido #${order.id}">
      <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
      <h2>Pedido #${order.id}</h2>
      <span class="order-status-badge" style="background-color: ${STATUS_COLORS[order.estado] ?? "#999"}">${order.estado}</span>
      <p class="order-modal-date">${formatDate(order.fecha)}</p>

      <div class="order-modal-section">
        <h3>Información de entrega</h3>
        <p><strong>Teléfono:</strong> ${order.telefono}</p>
        <p><strong>Forma de pago:</strong> ${order.formaPago}</p>
      </div>

      <div class="order-modal-section">
        <h3>Productos</h3>
        <div class="order-modal-detail-header">
          <span>Producto</span>
          <span>Cant.</span>
          <span>Subtotal</span>
        </div>
        ${detailsHtml}
      </div>

      <div class="order-modal-totals">
        <div class="order-modal-total-line">
          <span>Subtotal</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="order-modal-total-line">
          <span>Envío</span>
          <span>$${shipping.toFixed(2)}</span>
        </div>
        <div class="order-modal-total-line order-modal-total-final">
          <span>Total</span>
          <span>$${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const closeModal: () => void = () => {
    overlay.remove();
    document.body.style.overflow = "";
  };

  overlay.querySelector<HTMLButtonElement>(".modal-close")
    ?.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
};

const renderOrders: (orders: Order[], products: Product[]) => void = (
  orders: Order[],
  products: Product[],
) => {
  const container: HTMLElement | null =
    document.querySelector<HTMLElement>("[data-orders-list]");
  if (!container) return;

  container.innerHTML = "";

  if (orders.length === 0) {
    const empty: HTMLParagraphElement = document.createElement("p");
    empty.className = "orders-empty";
    empty.innerHTML =
      'No tenés pedidos aún. <a href="/src/pages/store/home/home.html">Ver catálogo</a>';
    container.appendChild(empty);
    return;
  }

  const sorted: Order[] = [...orders].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  sorted.forEach((order) => {
    const card: HTMLElement = document.createElement("article");
    card.className = "order-card";

    const productCount: number = order.detalles.length;
    const firstItems: string = order.detalles
      .slice(0, 3)
      .map((d) => {
        const p: Product | undefined = products.find(
          (p) => p.id === d.idProducto,
        );
        return p?.nombre ?? `Producto #${d.idProducto}`;
      })
      .join(", ");

    card.innerHTML = `
      <div class="order-card-header">
        <span class="order-card-id">Pedido #${order.id}</span>
        <span class="order-status-badge" style="background-color: ${STATUS_COLORS[order.estado] ?? "#999"}">${order.estado}</span>
      </div>
      <p class="order-card-date">${formatDate(order.fecha)}</p>
      <p class="order-card-summary">${firstItems}${productCount > 3 ? " y más..." : ""}</p>
      <p class="order-card-total"><strong>Total: $${order.total.toFixed(2)}</strong></p>
    `;

    card.addEventListener("click", () => renderModal(order, products));
    container.appendChild(card);
  });
};

const init: () => Promise<void> = async () => {
  const user: IUser | null = getCurrentUser();
  if (!user) return;

  loadLinks(user);

  const [jsonOrders, localOrders, products]: [Order[], Order[], Product[]] =
    await Promise.all([
      fetchJson<Order[]>("/data/pedidos.json").catch(() => []),
      Promise.resolve(getOrdersFromStorage()),
      fetchJson<Product[]>("/data/productos.json").catch(() => []),
    ]);

  const mergedMap: Map<number, Order> = new Map();
  for (const o of jsonOrders) {
    mergedMap.set(o.id, o);
  }
  for (const o of localOrders) {
    mergedMap.set(o.id, o);
  }

  const userOrders: Order[] = Array.from(mergedMap.values()).filter(
    (o) => o.idUsuario === user.id,
  );

  renderOrders(userOrders, products);
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const overlay: HTMLElement | null =
      document.querySelector<HTMLElement>(".modal-overlay");
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  }
});

init();
