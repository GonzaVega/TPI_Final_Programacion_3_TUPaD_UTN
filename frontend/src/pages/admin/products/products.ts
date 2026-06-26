import { fetchJson } from "../../../utils/fetchJson";
import { getCartItemsCount } from "../../../utils/cart/cartStorage";
import { CART_ICON } from "../../../utils/cart/cartIcon";
import type { Product } from "../../../types/product";
import type { ICategory } from "../../../types/category";

const STORAGE_KEY: string = "products";

let productos: Product[] = [];
let categorias: ICategory[] = [];

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

const loadFromStorage: () => Product[] = () => {
  const raw: string | null = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
};

const saveToStorage: (prods: Product[]) => void = (prods: Product[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prods));
};

const getCategoryName: (id: number) => string = (id: number) => {
  const cat: ICategory | undefined = categorias.find((c) => c.id === id);
  return cat?.nombre ?? `#${id}`;
};

const renderStatusBadge: (product: Product) => string = (
  product: Product,
) => {
  if (!product.disponible) {
    return '<span class="status-badge unavailable">No disponible</span>';
  }
  if (product.stock === 0) {
    return '<span class="status-badge no-stock">Sin stock</span>';
  }
  return '<span class="status-badge available">Disponible</span>';
};

const renderTable: () => void = () => {
  const tbody: HTMLElement | null = document.getElementById(
    "products-table-body",
  );
  if (!tbody) return;

  const activos: Product[] = productos.filter((p) => !p.eliminado);

  tbody.innerHTML = activos
    .map(
      (p) => `
    <tr>
      <td data-label="ID">${p.id}</td>
      <td data-label="Imagen"><img src="${p.imagen}" alt="${p.nombre}" /></td>
      <td data-label="Nombre">${p.nombre}</td>
      <td data-label="Descripción">${p.descripcion}</td>
      <td data-label="Precio">$${p.precio.toLocaleString()}</td>
      <td data-label="Categoría">${getCategoryName(p.categoriaId)}</td>
      <td data-label="Stock">${p.stock}</td>
      <td data-label="Estado">${renderStatusBadge(p)}</td>
      <td data-label="Acciones">
        <button type="button" data-edit-id="${p.id}">Editar</button>
        <button type="button" class="danger small" data-delete-id="${p.id}">Eliminar</button>
      </td>
    </tr>`,
    )
    .join("");

  tbody.querySelectorAll<HTMLButtonElement>("[data-edit-id]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const id: number = Number(btn.dataset.editId);
        const prod: Product | undefined = productos.find((p) => p.id === id);
        if (prod) openModal(prod);
      });
    });

  tbody.querySelectorAll<HTMLButtonElement>("[data-delete-id]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const id: number = Number(btn.dataset.deleteId);
        handleDelete(id);
      });
    });
};

const closeModal: () => void = () => {
  const overlay: HTMLElement | null =
    document.querySelector<HTMLElement>(".modal-overlay");
  if (overlay) overlay.remove();
  document.body.style.overflow = "";
};

const openModal: (existing?: Product) => void = (existing?: Product) => {
  const isEdit: boolean = existing !== undefined;
  const editProd: Product | undefined = existing;

  const activas: ICategory[] = categorias.filter((c) => !c.eliminado);
  const catOptions: string = activas
    .map(
      (c) =>
        `<option value="${c.id}" ${isEdit && editProd && editProd.categoriaId === c.id ? "selected" : ""}>${c.nombre}</option>`,
    )
    .join("");

  const overlay: HTMLElement = document.createElement("div");
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="${isEdit ? "Editar" : "Nuevo"} producto">
      <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
      <h2>${isEdit ? "Editar Producto" : "Nuevo Producto"}</h2>
      <form id="product-form">
        <label for="prod-name">Nombre *</label>
        <input type="text" id="prod-name" value="${isEdit && editProd ? editProd.nombre : ""}" required />

        <label for="prod-desc">Descripción *</label>
        <textarea id="prod-desc" required>${isEdit && editProd ? editProd.descripcion : ""}</textarea>

        <label for="prod-img">Imagen (URL) *</label>
        <input type="text" id="prod-img" value="${isEdit && editProd ? editProd.imagen : ""}" required />

        <div class="form-row">
          <div class="form-group">
            <label for="prod-price">Precio *</label>
            <input type="number" id="prod-price" min="0.01" step="0.01" value="${isEdit && editProd ? editProd.precio : ""}" required />
          </div>
          <div class="form-group">
            <label for="prod-stock">Stock *</label>
            <input type="number" id="prod-stock" min="0" value="${isEdit && editProd ? editProd.stock : ""}" required />
          </div>
        </div>

        <label for="prod-category">Categoría *</label>
        <select id="prod-category" required>
          <option value="">Seleccionar...</option>
          ${catOptions}
        </select>

        <div class="checkbox-group">
          <input type="checkbox" id="prod-available" ${isEdit && editProd && editProd.disponible ? "checked" : ""} />
          <label for="prod-available">Disponible</label>
        </div>

        <div class="modal-actions">
          <button type="submit">${isEdit ? "Guardar Cambios" : "Crear Producto"}</button>
          <button type="button" class="danger" id="modal-cancel-btn">Cancelar</button>
        </div>
        <p id="modal-feedback" class="modal-feedback" hidden></p>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  overlay.querySelector<HTMLButtonElement>(".modal-close")
    ?.addEventListener("click", closeModal);

  overlay.querySelector<HTMLButtonElement>("#modal-cancel-btn")
    ?.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  const form: HTMLFormElement | null =
    overlay.querySelector<HTMLFormElement>("#product-form");
  const feedbackEl: HTMLElement | null =
    overlay.querySelector<HTMLElement>("#modal-feedback");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput: HTMLInputElement | null =
      overlay.querySelector<HTMLInputElement>("#prod-name");
    const descInput: HTMLTextAreaElement | null =
      overlay.querySelector<HTMLTextAreaElement>("#prod-desc");
    const imgInput: HTMLInputElement | null =
      overlay.querySelector<HTMLInputElement>("#prod-img");
    const priceInput: HTMLInputElement | null =
      overlay.querySelector<HTMLInputElement>("#prod-price");
    const stockInput: HTMLInputElement | null =
      overlay.querySelector<HTMLInputElement>("#prod-stock");
    const catSelect: HTMLSelectElement | null =
      overlay.querySelector<HTMLSelectElement>("#prod-category");
    const availableCheck: HTMLInputElement | null =
      overlay.querySelector<HTMLInputElement>("#prod-available");
    const submitBtn: HTMLButtonElement | null =
      overlay.querySelector<HTMLButtonElement>('button[type="submit"]');

    const nombre: string = nameInput?.value.trim() ?? "";
    const descripcion: string = descInput?.value.trim() ?? "";
    const imagen: string = imgInput?.value.trim() ?? "";
    const precio: number = priceInput ? Number(priceInput.value) : 0;
    const stock: number = stockInput ? Number(stockInput.value) : 0;
    const categoriaId: number = catSelect ? Number(catSelect.value) : 0;
    const disponible: boolean = availableCheck?.checked ?? true;

    if (
      !nombre ||
      !descripcion ||
      !imagen ||
      precio <= 0 ||
      stock < 0 ||
      !categoriaId
    ) {
      return;
    }

    if (isEdit && editProd) {
      editProd.nombre = nombre;
      editProd.descripcion = descripcion;
      editProd.imagen = imagen;
      editProd.precio = precio;
      editProd.stock = stock;
      editProd.categoriaId = categoriaId;
      editProd.disponible = disponible;
    } else {
      const nuevo: Product = {
        id: Date.now(),
        nombre,
        descripcion,
        precio,
        stock,
        imagen,
        disponible,
        eliminado: false,
        categoriaId,
      };
      productos.push(nuevo);
    }

    saveToStorage(productos);
    renderTable();

    if (feedbackEl) {
      feedbackEl.textContent = isEdit
        ? "Producto actualizado."
        : "Producto creado.";
      feedbackEl.hidden = false;
    }
    if (submitBtn) submitBtn.disabled = true;

    setTimeout(closeModal, 800);
  });
};

const handleDelete: (id: number) => void = (id: number) => {
  const prod: Product | undefined = productos.find((p) => p.id === id);
  if (!prod) return;

  const confirmed: boolean = window.confirm(
    `¿Eliminar el producto "${prod.nombre}"?`,
  );
  if (!confirmed) return;

  prod.eliminado = true;
  saveToStorage(productos);
  renderTable();
};

const init: () => Promise<void> = async () => {
  loadLinks();

  const [jsonProducts, jsonCategories, storage]: [
    Product[],
    ICategory[],
    Product[],
  ] = await Promise.all([
    fetchJson<Product[]>("/data/productos.json").catch(() => []),
    fetchJson<ICategory[]>("/data/categorias.json").catch(() => []),
    Promise.resolve(loadFromStorage()),
  ]);

  categorias = jsonCategories;

  const mergedMap: Map<number, Product> = new Map();
  for (const p of jsonProducts) mergedMap.set(p.id, p);
  for (const p of storage) mergedMap.set(p.id, p);
  productos = Array.from(mergedMap.values());

  renderTable();

  document
    .getElementById("create-product-btn")
    ?.addEventListener("click", () => openModal());
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
