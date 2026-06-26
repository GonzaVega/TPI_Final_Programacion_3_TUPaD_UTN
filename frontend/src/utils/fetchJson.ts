export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener ${url}: ${response.status}`);
  }
  return response.json();
}
