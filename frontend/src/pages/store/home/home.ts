import { getCurrentUser } from "../../../utils/localStorage";
import { filterProductsByName } from "../../../utils/filters/productSearch";
import { filterProductsByCategory } from "../../../utils/filters/productCategoryFilter";
import { sortProducts } from "../../../utils/filters/productSort";
import type { SortOption } from "../../../utils/filters/productSort";
import {
  addProductToCart,
  getCartItemsCount,
} from "../../../utils/cart/cartStorage";
import type { Product } from "../../../types/product";
import { CART_ICON } from "../../../utils/cart/cartIcon";
import type { IUser } from "../../../types/IUser";
import type { ICategory } from "../../../types/category";
import { fetchJson } from "../../../utils/fetchJson";

let categorias: ICategory[] = [];
let products: Product[] = [];

const TODAS_LABEL: string = "Todas";
const TODAS_ID: number = 0;

let selectedCategoryId: number | null = null;
let searchValue: string = "";
let sortBy: SortOption | null = null;

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

  const adminLink: HTMLElement = document.createElement("li");
  const user: IUser | null = getCurrentUser();
  if (user?.role === "admin") {
    adminLink.innerHTML = `<a href="/src/pages/admin/adminHome/adminHome.html"><strong>Panel Admin</strong></a>`;
  }
  linksList.appendChild(adminLink);

  const logoutLi: HTMLElement = document.createElement("li");
  logoutLi.innerHTML = '<a href="#" id="logout-link">Cerrar Sesión</a>';
  linksList.appendChild(logoutLi);
};

const cargarCategorias: () => void = () => {
  const categoryList: HTMLElement | null =
    document.querySelector(".category-list");
  if (!categoryList) return;

  categoryList.innerHTML = "";

  const createCategoryItem = (id: number, name: string, active = false) => {
    const li: HTMLElement = document.createElement("li");
    const link: HTMLAnchorElement = document.createElement("a");

    link.href = "#";
    link.textContent = name;
    link.dataset.id = String(id);

    if (active) {
      link.classList.add("active");
    }

    li.appendChild(link);
    categoryList.appendChild(li);
  };

  createCategoryItem(TODAS_ID, TODAS_LABEL, true);

  categorias.forEach((categoria) => {
    createCategoryItem(categoria.id, categoria.nombre);
  });
};

const syncCartBadge: () => void = () => {
  const badge: HTMLElement | null =
    document.querySelector<HTMLElement>("[data-cart-badge]");
  if (!badge) return;

  const count: number = getCartItemsCount();
  badge.textContent = String(count);
  badge.hidden = count === 0;
};

const handleAddToCart: (product: Product) => void = (product: Product) => {
  addProductToCart(product);
  syncCartBadge();
};

const renderSinResultados: (container: Element) => void = (
  container: Element,
) => {
  const message: HTMLParagraphElement = document.createElement("p");
  message.className = "product-list-empty";
  message.textContent =
    "No se encontraron productos con los filtros aplicados.";
  container.appendChild(message);
};

// --- Modal State ---
let modalProduct: Product | null = null;
let modalQuantity: number = 1;

const closeDetailModal: () => void = () => {
  const overlay: HTMLElement | null =
    document.querySelector<HTMLElement>(".modal-overlay");
  if (overlay) {
    overlay.remove();
  }
  modalProduct = null;
  document.body.style.overflow = "";
};

const renderDetailModal: () => void = () => {
  const product: Product | null = modalProduct;
  if (!product) return;

  const isUnavailable: boolean = !product.disponible || product.stock === 0;
  const maxQty: number = isUnavailable ? 0 : product.stock;

  if (modalQuantity < 1 || modalQuantity > maxQty) {
    modalQuantity = 1;
  }

  const existingOverlay: HTMLElement | null =
    document.querySelector<HTMLElement>(".modal-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const categoryName: string | undefined = categorias.find(
    (c) => c.id === product.categoriaId,
  )?.nombre;
  const categoriesHtml: string = categoryName
    ? `<span>${categoryName}</span>`
    : "";

  const overlay: HTMLElement = document.createElement("div");
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="Detalle de ${product.nombre}">
      <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
      <div class="modal-body">
        <img src="${product.imagen}" alt="${product.nombre}" />
        <h2>${product.nombre}</h2>
        <p class="modal-description">${product.descripcion}</p>
        <p class="modal-price">$${product.precio.toLocaleString()}</p>
        <div class="modal-categories">${categoriesHtml}</div>
        <p class="modal-stock ${isUnavailable ? "out-of-stock" : "in-stock"}">
          ${isUnavailable ? "Sin stock" : `Stock disponible: ${product.stock}`}
        </p>
        <div class="modal-qty">
          <label for="modal-qty-input">Cantidad:</label>
          <div class="modal-qty-controls">
            <span id="modal-qty-display">${modalQuantity}</span>
            <button type="button" id="modal-qty-dec" ${isUnavailable ? "disabled" : ""}>&minus;</button>
            <button type="button" id="modal-qty-inc" ${isUnavailable || modalQuantity >= maxQty ? "disabled" : ""}>+</button>
          </div>
        </div>
        <div>
          <button type="button" id="modal-add-btn" class="modal-add-btn" ${isUnavailable ? "disabled" : ""}>
            Agregar al carrito
          </button>
          <span id="modal-add-feedback" class="modal-add-feedback" hidden>&check; Agregado</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  overlay.querySelector<HTMLButtonElement>(".modal-close")
    ?.addEventListener("click", closeDetailModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDetailModal();
    }
  });

  const decBtn: HTMLButtonElement | null =
    overlay.querySelector<HTMLButtonElement>("#modal-qty-dec");
  const incBtn: HTMLButtonElement | null =
    overlay.querySelector<HTMLButtonElement>("#modal-qty-inc");
  const qtyDisplay: HTMLElement | null =
    overlay.querySelector<HTMLElement>("#modal-qty-display");
  const addBtn: HTMLButtonElement | null =
    overlay.querySelector<HTMLButtonElement>("#modal-add-btn");
  const feedbackEl: HTMLElement | null =
    overlay.querySelector<HTMLElement>("#modal-add-feedback");

  const updateQtyDisplay = () => {
    if (qtyDisplay) qtyDisplay.textContent = String(modalQuantity);
    if (incBtn) incBtn.disabled = modalQuantity >= maxQty;
    if (decBtn) decBtn.disabled = modalQuantity <= 1;
  };

  decBtn?.addEventListener("click", () => {
    if (modalQuantity > 1) {
      modalQuantity--;
      updateQtyDisplay();
    }
  });

  incBtn?.addEventListener("click", () => {
    if (modalQuantity < maxQty) {
      modalQuantity++;
      updateQtyDisplay();
    }
  });

  addBtn?.addEventListener("click", () => {
    addProductToCart(product, modalQuantity);
    syncCartBadge();
    if (addBtn) addBtn.hidden = true;
    if (feedbackEl) feedbackEl.hidden = false;
    setTimeout(() => {
      closeDetailModal();
    }, 1000);
  });
};

const openDetailModal: (product: Product) => void = (product: Product) => {
  modalProduct = product;
  modalQuantity = 1;
  renderDetailModal();
};

const isProductAvailable: (product: Product) => boolean = (
  product: Product,
) => {
  return product.disponible && product.stock > 0;
};

const cargarProductos: (productsToRender: Product[]) => void = (
  productsToRender: Product[],
) => {
  const productList: HTMLElement | null =
    document.querySelector(".product-list");
  if (!productList) return;

  productList.innerHTML = "";

  if (productsToRender.length === 0) {
    renderSinResultados(productList);
    return;
  }

  productsToRender.forEach((producto) => {
    const isAvailable: boolean = isProductAvailable(producto);
    const article: HTMLElement = document.createElement("article");
    if (!isAvailable) {
      article.classList.add("out-of-stock");
    }

    article.innerHTML = `
      ${isAvailable ? '<span class="in-stock-badge">Disponible</span>' : '<span class="out-of-stock-badge">Sin stock</span>'}
      <img src="${producto.imagen}" alt="${producto.nombre}" height="200" width="250" />
      <h3>${producto.nombre}</h3>
      <p>${producto.descripcion}</p>
      <p><strong>Precio $${producto.precio.toLocaleString()}</strong></p>
    `;

    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.textContent = isAvailable
      ? "Agregar al carrito"
      : "Sin stock";
    button.disabled = !isAvailable;
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isAvailable) {
        handleAddToCart(producto);
      }
    });

    article.appendChild(button);

    article.addEventListener("click", () => {
      openDetailModal(producto);
    });

    productList.appendChild(article);
  });
};

const applyFilters: () => void = () => {
  const byCategory: Product[] = filterProductsByCategory(
    products,
    selectedCategoryId,
  );
  const byName: Product[] = filterProductsByName(byCategory, searchValue);
  const sorted: Product[] = sortProducts(byName, sortBy);
  cargarProductos(sorted);
};

const updateActiveCategory: (clickedId: string) => void = (
  clickedId: string,
) => {
  const links: NodeListOf<HTMLAnchorElement> =
    document.querySelectorAll<HTMLAnchorElement>(".category-list a");

  links.forEach((link) => {
    const isCurrent: boolean = link.dataset.id === clickedId;
    link.classList.toggle("active", isCurrent);
  });
};

const setupCategoryFilter: () => void = () => {
  const categoryList: HTMLElement | null =
    document.querySelector<HTMLElement>(".category-list");
  if (!categoryList) return;

  categoryList.addEventListener("click", (event) => {
    const target: HTMLElement | null = event.target as HTMLElement | null;
    const clickedLink: HTMLAnchorElement | null | undefined =
      target?.closest("a");
    if (!clickedLink) return;

    event.preventDefault();

    const id: string | undefined = clickedLink.dataset.id;
    if (!id) return;

    const parsedId: number = Number(id);

    selectedCategoryId = parsedId === TODAS_ID ? null : parsedId;
    updateActiveCategory(id);
    applyFilters();
  });
};

const setupSearch: () => void = () => {
  const form: HTMLFormElement | null =
    document.querySelector<HTMLFormElement>("main > form");
  const input: HTMLInputElement | null | undefined =
    form?.querySelector<HTMLInputElement>('input[type="text"]');

  if (!form || !input) return;

  const applySearch: () => void = () => {
    searchValue = input.value;
    applyFilters();
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    applySearch();
  });

  input.addEventListener("input", applySearch);
};

const setupSort: () => void = () => {
  const select: HTMLSelectElement | null =
    document.querySelector<HTMLSelectElement>("#sort-select");
  if (!select) return;

  select.addEventListener("change", () => {
    const value: string = select.value;
    sortBy = (value === "" ? null : value) as SortOption | null;
    applyFilters();
  });
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDetailModal();
  }
});

const init: () => Promise<void> = async () => {
  try {
    categorias = await fetchJson<ICategory[]>("/data/categorias.json");
    const allProducts: Product[] = await fetchJson<Product[]>("/data/productos.json");
    products = allProducts.filter((p) => p.disponible && !p.eliminado);
  } catch (err) {
    console.error("Error al cargar datos:", err);
  }

  loadLinks();
  cargarCategorias();
  applyFilters();
  setupCategoryFilter();
  setupSearch();
  setupSort();
  syncCartBadge();
};

init();
