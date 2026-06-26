export interface OrderDetail {
  idProducto: number;
  cantidad: number;
  subtotal: number;
}

export type OrderStatus = "PENDIENTE" | "CONFIRMADO" | "TERMINADO" | "CANCELADO";

export interface Order {
  id: number;
  fecha: string;
  estado: OrderStatus;
  total: number;
  formaPago: string;
  telefono: string;
  idUsuario: number;
  detalles: OrderDetail[];
}
