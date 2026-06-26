import type { Product } from "../../types/product";

export type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc";

export function sortProducts(
  products: Product[],
  sortBy: SortOption | null,
): Product[] {
  if (!sortBy) return products;

  const sorted: Product[] = [...products];

  switch (sortBy) {
    case "name-asc":
      sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.nombre.localeCompare(a.nombre));
      break;
    case "price-asc":
      sorted.sort((a, b) => a.precio - b.precio);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.precio - a.precio);
      break;
  }

  return sorted;
}
