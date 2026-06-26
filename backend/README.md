# Food Store - Backend JPA / Consola

## Datos académicos

- Alumno: Gonzalo Vega
- Materia: Programación 3 (TUPaD - UTN)
- Trabajo: TPI - Food Store

## Descripción

Aplicación de consola desarrollada con Java, Gradle, JPA, Hibernate y H2 para gestionar categorías, productos, usuarios y pedidos con sus líneas de detalle. Implementa relaciones JPA, soft delete, consultas JPQL personalizadas y un menú de consola navegable.

## Funcionalidades implementadas

- CRUD genérico con BaseRepository<T>
- ABM completo de categorías, productos, usuarios y pedidos
- Consultas JPQL: productos por categoría, pedidos por usuario, pedidos por estado, total facturado
- Alta de pedido con validaciones de stock, transacción atómica y reducción de inventario
- Baja lógica en todas las entidades
- DataSeeder con datos iniciales de prueba

## Requisitos

- Java 17 o superior
- IntelliJ IDEA (recomendado)
- Soporte para Lombok

## Estructura del proyecto

```text
backend/
├── build.gradle
├── settings.gradle
├── gradlew
├── gradlew.bat
├── gradle/wrapper/
└── src/main/java/com/tp/jpa/
    ├── Main.java
    ├── model/
    │   ├── Base.java
    │   ├── Categoria.java
    │   ├── Producto.java
    │   ├── Usuario.java
    │   ├── Pedido.java
    │   ├── DetallePedido.java
    │   ├── Calculable.java
    │   └── enums/
    │       ├── Rol.java
    │       ├── Estado.java
    │       └── FormaPago.java
    ├── dto/
    │   └── UsuarioDTO.java
    ├── repository/
    │   ├── BaseRepository.java
    │   ├── CategoriaRepository.java
    │   ├── ProductoRepository.java
    │   ├── UsuarioRepository.java
    │   └── PedidoRepository.java
    └── util/
        ├── JPAUtil.java
        ├── DataSeeder.java
        └── ConsoleTablePrinter.java
```

## Instalación y ejecución

1. Abrir el proyecto en IntelliJ IDEA.
2. Esperar la sincronización de Gradle.
3. Ejecutar la clase principal `com.tp.jpa.Main`.
4. Usar el menú de consola para navegar por el sistema.
