import type { Product } from "../../types/product";

export function filterProductsByCategory(
  products: Product[],
  selectedCategoryId: number | null,
): Product[] {
  if (!selectedCategoryId) {
    return products;
  }

  return products.filter(
    (product) => product.categoriaId === selectedCategoryId,
  );
}
