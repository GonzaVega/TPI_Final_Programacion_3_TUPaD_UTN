import { fetchJson } from "../../../utils/fetchJson";
import { getCartItemsCount } from "../../../utils/cart/cartStorage";
import { CART_ICON } from "../../../utils/cart/cartIcon";
import type { Order, OrderStatus } from "../../../types/order";

interface RawUser {
  id: number;
  nombre: string;
  apellido: string;
  mail: string;
  celular: string;
  password: string;
  rol: string;
}

const STORAGE_KEY: string = "orders";

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "#f59e0b",
  CONFIRMADO: "#3b82f6",
  TERMINADO: "#22c55e",
  CANCELADO: "#ef4444",
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDIENTE",
  "CONFIRMADO",
  "TERMINADO",
  "CANCELADO",
];

let orders: Order[] = [];
let userMap: Map<number, RawUser> = new Map();
let currentFilter: string = "TODOS";

const loadLinks: () => void = () => {
  const linksList: HTMLElement | null = document.querySelector(".navbar-menu");
  if (!linksList) return;

  linksList.innerHTML = "";

  const links: { label: string; url: string }[] = [
    { label: "Inicio", url: "/src/pages/store/home/home.html" },
    { label: "Mis Pedidos", url: "/src/pages/client/orders/orders.html" },
  ];

  links.forEach((link) => {
    const li: HTMLElement = document.createElement("li");
    li.innerHTML = `<a href="${link.url}">${link.label}</a>`;
    linksList.appendChild(li);
  });

  const cartLi: HTMLElement = document.createElement("li");
  cartLi.className = "navbar-cart-item";
  cartLi.innerHTML = `
    <a href="/src/pages/store/cart/cart.html" class="navbar-cart-link" aria-label="Carrito de supermercado">
      <span class="navbar-cart-icon">${CART_ICON}</span>
      <span class="navbar-cart-badge" data-cart-badge aria-live="polite"></span>
    </a>
  `;
  linksList.appendChild(cartLi);

  const adminLi: HTMLElement = document.createElement("li");
  adminLi.innerHTML =
    '<a href="/src/pages/admin/adminHome/adminHome.html"><strong>Panel Admin</strong></a>';
  linksList.appendChild(adminLi);

  const logoutLi: HTMLElement = document.createElement("li");
  logoutLi.innerHTML = '<a href="#" id="logout-link">Cerrar Sesión</a>';
  linksList.appendChild(logoutLi);

  const badge: HTMLElement | null =
    document.querySelector<HTMLElement>("[data-cart-badge]");
  if (badge) {
    const count: number = getCartItemsCount();
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }
};

const loadFromStorage: () => Order[] = () => {
  const raw: string | null = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
};

const saveToStorage: (ords: Order[]) => void = (ords: Order[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ords));
};

const getUserName: (id: number) => string = (id: number) => {
  const user: RawUser | undefined = userMap.get(id);
  if (!user) return `#${id}`;
  return `${user.nombre} ${user.apellido}`;
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

const renderTable: () => void = () => {
  const tbody: HTMLElement | null = document.getElementById(
    "orders-table-body",
  );
  if (!tbody) return;

  const filtered: Order[] =
    currentFilter === "TODOS"
      ? [...orders]
      : orders.filter((o) => o.estado === currentFilter);

  const sorted: Order[] = filtered.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#999;">No hay pedidos${currentFilter !== "TODOS" ? " con ese estado" : ""}.</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted
    .map(
      (o) => `
    <tr>
      <td data-label="ID">${o.id}</td>
      <td data-label="Cliente">${getUserName(o.idUsuario)}</td>
      <td data-label="Fecha">${formatDate(o.fecha)}</td>
      <td data-label="Estado"><span class="order-status-badge" style="background-color: ${STATUS_COLORS[o.estado] ?? "#999"}">${o.estado}</span></td>
      <td data-label="Productos">${o.detalles.length} producto(s)</td>
      <td data-label="Total">$${o.total.toFixed(2)}</td>
    </tr>`,
    )
    .join("");

  tbody.querySelectorAll("tr").forEach((row, index) => {
    row.addEventListener("click", () => {
      const order: Order | undefined = sorted[index];
      if (order) renderModal(order);
    });
    row.style.cursor = "pointer";
  });
};

const closeModal: () => void = () => {
  const overlay: HTMLElement | null =
    document.querySelector<HTMLElement>(".modal-overlay");
  if (overlay) overlay.remove();
  document.body.style.overflow = "";
};

const renderModal: (order: Order) => void = (order: Order) => {
  const overlay: HTMLElement = document.createElement("div");
  overlay.className = "modal-overlay";

  const detailsHtml: string = order.detalles
    .map(
      (d) => `
    <div class="order-modal-detail-row">
      <span>Producto #${d.idProducto}</span>
      <span>x${d.cantidad}</span>
      <span>$${d.subtotal.toFixed(2)}</span>
    </div>`,
    )
    .join("");

  const subtotal: number = order.detalles.reduce(
    (sum, d) => sum + d.subtotal,
    0,
  );
  const shipping: number = order.total - subtotal;

  const statusOptions: string = ORDER_STATUSES
    .map(
      (s) =>
        `<option value="${s}" ${order.estado === s ? "selected" : ""}>${s}</option>`,
    )
    .join("");

  overlay.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="Detalle del pedido #${order.id}">
      <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
      <div class="modal-header-info">
        <h2>Pedido #${order.id}</h2>
        <span class="order-status-badge" style="background-color: ${STATUS_COLORS[order.estado] ?? "#999"}">${order.estado}</span>
      </div>
      <p class="order-modal-date">${formatDate(order.fecha)}</p>

      <div class="order-modal-section">
        <h3>Información de entrega</h3>
        <p><strong>Cliente:</strong> ${getUserName(order.idUsuario)}</p>
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

      <div class="order-modal-status-section">
        <label for="modal-status-select">Estado:</label>
        <select id="modal-status-select">${statusOptions}</select>
        <button type="button" id="modal-save-status">Guardar</button>
      </div>
      <p id="modal-feedback" class="modal-feedback" hidden></p>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  overlay.querySelector<HTMLButtonElement>(".modal-close")
    ?.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  const saveBtn: HTMLButtonElement | null =
    overlay.querySelector<HTMLButtonElement>("#modal-save-status");
  const feedbackEl: HTMLElement | null =
    overlay.querySelector<HTMLElement>("#modal-feedback");

  saveBtn?.addEventListener("click", () => {
    const select: HTMLSelectElement | null =
      overlay.querySelector<HTMLSelectElement>("#modal-status-select");
    if (!select) return;

    const newStatus: OrderStatus = select.value as OrderStatus;
    if (newStatus === order.estado) {
      if (feedbackEl) {
        feedbackEl.textContent = "El estado seleccionado es el mismo.";
        feedbackEl.hidden = false;
        feedbackEl.style.color = "#999";
      }
      return;
    }

    order.estado = newStatus;
    saveToStorage(orders);
    renderTable();

    if (feedbackEl) {
      feedbackEl.textContent = "Estado actualizado.";
      feedbackEl.hidden = false;
      feedbackEl.style.color = "var(--color-exito)";
    }
    saveBtn.disabled = true;

    setTimeout(closeModal, 800);
  });
};

const init: () => Promise<void> = async () => {
  loadLinks();

  const [jsonOrders, jsonUsers, storage]: [Order[], RawUser[], Order[]] =
    await Promise.all([
      fetchJson<Order[]>("/data/pedidos.json").catch(() => []),
      fetchJson<RawUser[]>("/data/usuarios.json").catch(() => []),
      Promise.resolve(loadFromStorage()),
    ]);

  for (const u of jsonUsers) {
    userMap.set(u.id, u);
  }

  const mergedMap: Map<number, Order> = new Map();
  for (const o of jsonOrders) mergedMap.set(o.id, o);
  for (const o of storage) mergedMap.set(o.id, o);
  orders = Array.from(mergedMap.values());

  renderTable();

  const filterSelect: HTMLSelectElement | null =
    document.querySelector<HTMLSelectElement>("#status-filter");
  filterSelect?.addEventListener("change", () => {
    currentFilter = filterSelect.value;
    renderTable();
  });
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
