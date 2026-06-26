import { fetchJson } from "../../../utils/fetchJson";
import { getCartItemsCount } from "../../../utils/cart/cartStorage";
import { CART_ICON } from "../../../utils/cart/cartIcon";
import type { ICategory } from "../../../types/category";
import type { Product } from "../../../types/product";
import type { Order } from "../../../types/order";

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "#f59e0b",
  CONFIRMADO: "#3b82f6",
  TERMINADO: "#22c55e",
  CANCELADO: "#ef4444",
};

const ORDERS_KEY: string = "orders";

const CARD_COLORS: string[] = [
  "#e0f2fe",
  "#dcfce7",
  "#ffedd5",
  "#f3e8ff",
];

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

const loadLinks: () => void = () => {
  const linksList: HTMLElement | null = document.querySelector(".navbar-menu");
  if (!linksList) return;

  linksList.innerHTML = "";

  const homeLi: HTMLElement = document.createElement("li");
  homeLi.innerHTML =
    '<a href="/src/pages/store/home/home.html">Inicio</a>';
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

const renderStats: (
  categorias: ICategory[],
  productos: Product[],
  pedidos: Order[],
) => void = (
  categorias: ICategory[],
  productos: Product[],
  pedidos: Order[],
) => {
  const grid: HTMLElement | null =
    document.querySelector<HTMLElement>("[data-stats-grid]");
  if (!grid) return;

  const disponibles: number = productos.filter(
    (p) => p.disponible && !p.eliminado,
  ).length;

  const stats: { label: string; value: number }[] = [
    { label: "Categorías", value: categorias.length },
    { label: "Productos", value: productos.length },
    { label: "Pedidos", value: pedidos.length },
    { label: "Disponibles", value: disponibles },
  ];

  grid.innerHTML = stats
    .map(
      (s, i) => `
      <div class="stat-card stat-card-${i}" style="background-color: ${CARD_COLORS[i]}">
        <p class="stat-number">${s.value}</p>
        <p class="stat-label">${s.label}</p>
      </div>`,
    )
    .join("");
};

const renderResumen: (
  categorias: ICategory[],
  productos: Product[],
  pedidos: Order[],
) => void = (
  categorias: ICategory[],
  productos: Product[],
  pedidos: Order[],
) => {
  const container: HTMLElement | null =
    document.querySelector<HTMLElement>("[data-admin-resumen]");
  if (!container) return;

  const activas: number = categorias.filter((c) => !c.eliminado).length;
  const eliminadasCat: number = categorias.filter((c) => c.eliminado).length;

  const disponibles: number = productos.filter(
    (p) => p.disponible && !p.eliminado,
  ).length;
  const noDisponibles: number = productos.filter(
    (p) => !p.disponible || p.eliminado,
  ).length;

  const estados: string[] = ["PENDIENTE", "CONFIRMADO", "TERMINADO", "CANCELADO"];
  const pedidosPorEstado: { estado: string; cantidad: number }[] = estados.map(
    (estado) => ({
      estado,
      cantidad: pedidos.filter((p) => p.estado === estado).length,
    }),
  );

  container.innerHTML = `
    <h2>Resumen del Sistema</h2>
    <div class="resumen-grid">
      <div class="resumen-section">
        <h3>Categorías</h3>
        <p><span>Activas</span><span>${activas}</span></p>
        <p><span>Eliminadas</span><span>${eliminadasCat}</span></p>
      </div>
      <div class="resumen-section">
        <h3>Productos</h3>
        <p><span>Disponibles</span><span>${disponibles}</span></p>
        <p><span>No disponibles</span><span>${noDisponibles}</span></p>
      </div>
      <div class="resumen-section">
        <h3>Pedidos por estado</h3>
        ${pedidosPorEstado
          .map(
            (p) => `
          <p>
            <span>
              <span class="badge" style="background-color: ${STATUS_COLORS[p.estado] ?? "#999"}">${p.estado}</span>
            </span>
            <span>${p.cantidad}</span>
          </p>`,
          )
          .join("")}
      </div>
    </div>
  `;
};

const init: () => Promise<void> = async () => {
  loadLinks();

  const [categorias, productos, jsonPedidos]: [
    ICategory[],
    Product[],
    Order[],
  ] = await Promise.all([
    fetchJson<ICategory[]>("/data/categorias.json").catch(() => []),
    fetchJson<Product[]>("/data/productos.json").catch(() => []),
    fetchJson<Order[]>("/data/pedidos.json").catch(() => []),
  ]);

  const localPedidos: Order[] = getOrdersFromStorage();
  const mergedPedidos: Map<number, Order> = new Map();
  for (const o of jsonPedidos) mergedPedidos.set(o.id, o);
  for (const o of localPedidos) mergedPedidos.set(o.id, o);
  const pedidos: Order[] = Array.from(mergedPedidos.values());

  renderStats(categorias, productos, pedidos);
  renderResumen(categorias, productos, pedidos);
};

init();
