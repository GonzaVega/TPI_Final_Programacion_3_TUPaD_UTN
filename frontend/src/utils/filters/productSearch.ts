import type { Product } from "../../types/product";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function filterProductsByName(
  products: Product[],
  searchTerm: string,
): Product[] {
  const normalizedSearch: string = normalizeText(searchTerm);

  if (!normalizedSearch) {
    return products;
  }

  return products.filter((product) =>
    normalizeText(product.nombre).includes(normalizedSearch),
  );
}
