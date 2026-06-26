import { fetchJson } from "../../../utils/fetchJson";
import { getCartItemsCount } from "../../../utils/cart/cartStorage";
import { CART_ICON } from "../../../utils/cart/cartIcon";
import type { ICategory } from "../../../types/category";

const STORAGE_KEY: string = "categories";

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

const loadFromStorage: () => ICategory[] = () => {
  const raw: string | null = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ICategory[]) : [];
  } catch {
    return [];
  }
};

const saveToStorage: (cats: ICategory[]) => void = (cats: ICategory[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
};

const renderTable: () => void = () => {
  const tbody: HTMLElement | null = document.getElementById(
    "categories-table-body",
  );
  if (!tbody) return;

  const activas: ICategory[] = categorias.filter((c) => !c.eliminado);

  tbody.innerHTML = activas
    .map(
      (c) => `
    <tr>
      <td data-label="ID">${c.id}</td>
      <td data-label="Imagen"><img src="${c.imagen}" alt="${c.nombre}" /></td>
      <td data-label="Nombre">${c.nombre}</td>
      <td data-label="Descripción">${c.descripcion}</td>
      <td data-label="Acciones">
        <button type="button" data-edit-id="${c.id}">Editar</button>
        <button type="button" class="danger small" data-delete-id="${c.id}">Eliminar</button>
      </td>
    </tr>`,
    )
    .join("");

  tbody.querySelectorAll<HTMLButtonElement>("[data-edit-id]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const id: number = Number(btn.dataset.editId);
        const cat: ICategory | undefined = categorias.find((c) => c.id === id);
        if (cat) openModal(cat);
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

const openModal: (existing?: ICategory) => void = (existing?: ICategory) => {
  const isEdit: boolean = existing !== undefined;
  const editCat: ICategory | undefined = existing;

  const overlay: HTMLElement = document.createElement("div");
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="${isEdit ? "Editar" : "Nueva"} categoría">
      <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
      <h2>${isEdit ? "Editar Categoría" : "Nueva Categoría"}</h2>
      <form id="category-form">
        <label for="cat-name">Nombre *</label>
        <input type="text" id="cat-name" value="${isEdit && editCat ? editCat.nombre : ""}" required />

        <label for="cat-desc">Descripción *</label>
        <textarea id="cat-desc" required>${isEdit && editCat ? editCat.descripcion : ""}</textarea>

        <label for="cat-img">Imagen (URL) *</label>
        <input type="text" id="cat-img" value="${isEdit && editCat ? editCat.imagen : ""}" required />

        <div class="modal-actions">
          <button type="submit">${isEdit ? "Guardar Cambios" : "Crear Categoría"}</button>
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
    overlay.querySelector<HTMLFormElement>("#category-form");
  const feedbackEl: HTMLElement | null =
    overlay.querySelector<HTMLElement>("#modal-feedback");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput: HTMLInputElement | null =
      overlay.querySelector<HTMLInputElement>("#cat-name");
    const descInput: HTMLTextAreaElement | null =
      overlay.querySelector<HTMLTextAreaElement>("#cat-desc");
    const imgInput: HTMLInputElement | null =
      overlay.querySelector<HTMLInputElement>("#cat-img");
    const submitBtn: HTMLButtonElement | null =
      overlay.querySelector<HTMLButtonElement>('button[type="submit"]');

    const nombre: string = nameInput?.value.trim() ?? "";
    const descripcion: string = descInput?.value.trim() ?? "";
    const imagen: string = imgInput?.value.trim() ?? "";

    if (!nombre || !descripcion || !imagen) return;

    if (isEdit && existing) {
      existing.nombre = nombre;
      existing.descripcion = descripcion;
      existing.imagen = imagen;
    } else {
      const nueva: ICategory = {
        id: Date.now(),
        nombre,
        descripcion,
        imagen,
        eliminado: false,
      };
      categorias.push(nueva);
    }

    saveToStorage(categorias);
    renderTable();

    if (feedbackEl) {
      feedbackEl.textContent = isEdit
        ? "Categoría actualizada."
        : "Categoría creada.";
      feedbackEl.hidden = false;
    }
    if (submitBtn) submitBtn.disabled = true;

    setTimeout(closeModal, 800);
  });
};

const handleDelete: (id: number) => void = (id: number) => {
  const cat: ICategory | undefined = categorias.find((c) => c.id === id);
  if (!cat) return;

  const confirmed: boolean = window.confirm(
    `¿Eliminar la categoría "${cat.nombre}"?`,
  );
  if (!confirmed) return;

  cat.eliminado = true;
  saveToStorage(categorias);
  renderTable();
};

const init: () => Promise<void> = async () => {
  loadLinks();

  const json: ICategory[] = await fetchJson<ICategory[]>(
    "/data/categorias.json",
  ).catch(() => []);
  const storage: ICategory[] = loadFromStorage();

  const mergedMap: Map<number, ICategory> = new Map();
  for (const c of json) mergedMap.set(c.id, c);
  for (const c of storage) mergedMap.set(c.id, c);

  categorias = Array.from(mergedMap.values());

  renderTable();

  document
    .getElementById("create-category-btn")
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
