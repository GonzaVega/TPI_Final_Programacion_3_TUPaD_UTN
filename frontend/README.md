# Food Store - Frontend Web

## Datos académicos

- Alumno: Gonzalo Vega
- Comisión: 11
- Materia: Programación 3 (TUPaD - UTN)
- Trabajo: TPI - Food Store

## Descripción

Interfaz web del sistema Food Store desarrollada con TypeScript, Vite, HTML5 y CSS3. En esta iteración, el frontend consume datos desde archivos .json locales mediante fetch(), permitiendo construir y verificar todos los flujos de usuario de forma independiente al backend.

## Funcionalidades implementadas

- Autenticación (login/registro) contra usuarios.json con persistencia en localStorage
- Catálogo de productos con filtro por categoría, búsqueda y ordenamiento
- Detalle de producto con validación de stock
- Carrito de compras con persistencia en localStorage
- Checkout con selección de forma de pago
- Historial de pedidos del cliente
- Panel de administración con dashboard, CRUD de categorías, CRUD de productos y gestión de pedidos

## Requisitos

- Node.js 18 o superior
- pnpm (instalar con `npm install -g pnpm`)

## Instalación y ejecución

```bash
pnpm install
pnpm dev
```

El proyecto quedará disponible en http://localhost:5173

## Credenciales de prueba

| Rol     | Email          | Contraseña  |
| ------- | -------------- | ----------- |
| ADMIN   | admin@test.com | password123 |
| USUARIO | juan@perez.com | password123 |

## Scripts disponibles

- `pnpm dev` - inicia servidor de desarrollo
- `pnpm build` - genera build de producción
- `pnpm preview` - previsualiza build de producción
