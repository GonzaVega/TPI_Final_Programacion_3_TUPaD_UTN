package com.tp.jpa;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Scanner;

import com.tp.jpa.dto.UsuarioDTO;
import com.tp.jpa.model.Categoria;
import com.tp.jpa.model.DetallePedido;
import com.tp.jpa.model.Pedido;
import com.tp.jpa.model.Producto;
import com.tp.jpa.model.Usuario;
import com.tp.jpa.model.enums.Estado;
import com.tp.jpa.model.enums.FormaPago;
import com.tp.jpa.model.enums.Rol;
import com.tp.jpa.repository.CategoriaRepository;
import com.tp.jpa.repository.PedidoRepository;
import com.tp.jpa.repository.ProductoRepository;
import com.tp.jpa.repository.UsuarioRepository;
import com.tp.jpa.util.ConsoleTablePrinter;
import com.tp.jpa.util.DataSeeder;
import com.tp.jpa.util.JPAUtil;

public class Main {

    public static void main(String[] args) {
        CategoriaRepository categoriaRepo = new CategoriaRepository();
        ProductoRepository productoRepo = new ProductoRepository();
        UsuarioRepository usuarioRepo = new UsuarioRepository();
        PedidoRepository pedidoRepo = new PedidoRepository();

        DataSeeder.seedIfNeeded();

        try (Scanner scanner = new Scanner(System.in)) {
            boolean running = true;
            while (running) {
                System.out.println("\n--- Menú principal ---");
                System.out.println("1) Categorías");
                System.out.println("2) Productos");
                System.out.println("3) Usuarios");
                System.out.println("4) Pedidos");
                System.out.println("5) Reportes");
                System.out.println("0) Salir");
                System.out.print("Elija una opción: ");
                String opt = scanner.nextLine().trim();

                switch (opt) {
                    case "1" -> categoriasMenu(scanner, categoriaRepo);
                    case "2" -> productosMenu(scanner, productoRepo, categoriaRepo);
                    case "3" -> usuariosMenu(scanner, usuarioRepo);
                    case "4" -> pedidosMenu(scanner, pedidoRepo, usuarioRepo, productoRepo);
                    case "5" -> reportesMenu(scanner, productoRepo, categoriaRepo, usuarioRepo, pedidoRepo);
                    case "0" -> {
                        System.out.println("Saliendo del sistema.");
                        running = false;
                    }
                    default -> System.out.println("Opción inválida.");
                }
            }
        } finally {
            JPAUtil.close();
        }
    }

    private static void categoriasMenu(Scanner scanner, CategoriaRepository categoriaRepo) {
        while (true) {
            System.out.println("\n--- Categorías ---");
            System.out.println("1) Alta");
            System.out.println("2) Baja lógica");
            System.out.println("3) Modificación");
            System.out.println("4) Listado");
            System.out.println("0) Volver");
            System.out.print("Opción: ");
            String opt = scanner.nextLine().trim();

            switch (opt) {
                case "1" -> {
                    System.out.print("Nombre: ");
                    String nombre = scanner.nextLine().trim();
                    if (nombre.isEmpty()) {
                        System.out.println("El nombre no puede estar vacío.");
                        break;
                    }
                    System.out.print("Descripción: ");
                    String desc = scanner.nextLine().trim();
                    Categoria c = Categoria.builder().nombre(nombre).descripcion(desc).build();
                    Categoria saved = categoriaRepo.guardar(c);
                    System.out.println("Categoría guardada con ID: " + saved.getId());
                }
                case "2" -> {
                    List<Categoria> lista = categoriaRepo.listarActivos();
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre" },
                        lista.stream().map(cat -> new String[]{ String.valueOf(cat.getId()), cat.getNombre() }).toList()
                    );
                    System.out.print("ID a dar de baja: ");
                    String idStr = scanner.nextLine().trim();
                    try {
                        Long id = Long.parseLong(idStr);
                        Optional<Categoria> optCat = categoriaRepo.buscarPorId(id);
                        if (optCat.isEmpty() || optCat.get().isEliminado()) {
                            System.out.println("La categoría con ID " + id + " no existe o ya está dada de baja.");
                            break;
                        }
                        Categoria categoria = optCat.get();
                        boolean ok = categoriaRepo.eliminarLogico(id);
                        if (ok) {
                            System.out.println("Categoría dada de baja: " + categoria.getNombre());
                        } else {
                            System.out.println("No se pudo dar de baja la categoría: " + categoria.getNombre());
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("ID inválido.");
                    }
                }
                case "3" -> {
                    List<Categoria> lista = categoriaRepo.listarActivos();
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre", "Descripción" },
                        lista.stream().map(cat -> new String[]{ String.valueOf(cat.getId()), cat.getNombre(), cat.getDescripcion() }).toList()
                    );
                    System.out.print("ID a modificar: ");
                    String idStr = scanner.nextLine().trim();
                    try {
                        Long id = Long.parseLong(idStr);
                        Optional<Categoria> optCat = categoriaRepo.buscarPorId(id);
                        if (optCat.isEmpty() || optCat.get().isEliminado()) {
                            System.out.println("ID no corresponde a una categoría activa.");
                            break;
                        }
                        Categoria cat = optCat.get();
                        System.out.println("Nombre actual: " + cat.getNombre());
                        System.out.print("Nuevo nombre (enter para conservar): ");
                        String nuevoNombre = scanner.nextLine();
                        if (!nuevoNombre.isBlank()) cat.setNombre(nuevoNombre.trim());
                        System.out.println("Descripción actual: " + cat.getDescripcion());
                        System.out.print("Nueva descripción (enter para conservar): ");
                        String nuevaDesc = scanner.nextLine();
                        if (!nuevaDesc.isBlank()) cat.setDescripcion(nuevaDesc.trim());
                        categoriaRepo.guardar(cat);
                        System.out.println("Categoría actualizada.");
                    } catch (NumberFormatException e) {
                        System.out.println("ID inválido.");
                    }
                }
                case "4" -> {
                    List<Categoria> lista = categoriaRepo.listarActivos();
                    System.out.println("\nCategorías activas:");
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre", "Descripción" },
                        lista.stream().map(cat -> new String[]{ String.valueOf(cat.getId()), cat.getNombre(), cat.getDescripcion() }).toList()
                    );
                }
                case "0" -> { return; }
                default -> System.out.println("Opción inválida.");
            }
        }
    }

    private static void productosMenu(Scanner scanner, ProductoRepository productoRepo, CategoriaRepository categoriaRepo) {
        while (true) {
            System.out.println("\n--- Productos ---");
            System.out.println("1) Alta");
            System.out.println("2) Baja lógica");
            System.out.println("3) Modificación");
            System.out.println("4) Listado");
            System.out.println("0) Volver");
            System.out.print("Opción: ");
            String opt = scanner.nextLine().trim();

            switch (opt) {
                case "1" -> {
                    List<Categoria> cats = categoriaRepo.listarActivos();
                    if (cats.isEmpty()) { System.out.println("No hay categorías activas. Alta cancelada."); break; }
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre" },
                        cats.stream().map(cat -> new String[]{ String.valueOf(cat.getId()), cat.getNombre() }).toList()
                    );
                    System.out.print("ID categoría: ");
                    String cid = scanner.nextLine().trim();
                    try {
                        Long idCat = Long.parseLong(cid);
                        Optional<Categoria> optCat = categoriaRepo.buscarPorId(idCat);
                        if (optCat.isEmpty() || optCat.get().isEliminado()) { System.out.println("Categoría inválida."); break; }
                        Categoria cat = optCat.get();
                        System.out.print("Nombre producto: ");
                        String nombre = scanner.nextLine().trim();
                        if (nombre.isEmpty()) { System.out.println("Nombre vacío. Alta cancelada."); break; }
                        System.out.print("Descripción: ");
                        String desc = scanner.nextLine().trim();
                        System.out.print("Precio (>0): ");
                        double precio = Double.parseDouble(scanner.nextLine().trim());
                        if (precio <= 0) { System.out.println("Precio inválido. Alta cancelada."); break; }
                        System.out.print("Stock (>=0): ");
                        int stock = Integer.parseInt(scanner.nextLine().trim());
                        if (stock < 0) { System.out.println("Stock inválido. Alta cancelada."); break; }
                        System.out.print("Imagen (opcional): ");
                        String imagen = scanner.nextLine().trim();
                        System.out.print("Disponible (S/N, default S): ");
                        String disp = scanner.nextLine().trim();
                        boolean disponible = disp.isEmpty() || disp.equalsIgnoreCase("S");
                        Producto p = Producto.builder().nombre(nombre).descripcion(desc).precio(precio).stock(stock).imagen(imagen).disponible(disponible).build();
                        p.setCategoria(cat);
                        Producto saved = productoRepo.guardar(p);
                        System.out.println("Producto guardado con ID: " + saved.getId() + " en categoría " + cat.getNombre());
                    } catch (NumberFormatException e) {
                        System.out.println("Entrada numérica inválida.");
                    }
                }
                case "2" -> {
                    List<Producto> prods = productoRepo.listarActivos();
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre" },
                        prods.stream().map(pr -> new String[]{ String.valueOf(pr.getId()), pr.getNombre() }).toList()
                    );
                    System.out.print("ID producto a dar de baja: ");
                    String idStr = scanner.nextLine().trim();
                    try {
                        Long id = Long.parseLong(idStr);
                        Optional<Producto> optProducto = productoRepo.buscarPorId(id);
                        if (optProducto.isEmpty() || optProducto.get().isEliminado()) {
                            System.out.println("El producto con ID " + id + " no existe o ya está dado de baja.");
                            break;
                        }
                        Producto producto = optProducto.get();
                        boolean ok = productoRepo.eliminarLogico(id);
                        if (ok) {
                            System.out.println("Producto dado de baja: " + producto.getNombre());
                        } else {
                            System.out.println("No se pudo dar de baja el producto: " + producto.getNombre());
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("ID inválido.");
                    }
                }
                case "3" -> {
                    List<Producto> prods = productoRepo.listarActivos();
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre", "Precio", "Stock" },
                        prods.stream().map(pr -> new String[]{
                            String.valueOf(pr.getId()), pr.getNombre(),
                            String.format("%.2f", pr.getPrecio()), String.valueOf(pr.getStock())
                        }).toList()
                    );
                    System.out.print("ID producto a modificar: ");
                    String idStr = scanner.nextLine().trim();
                    try {
                        Long id = Long.parseLong(idStr);
                        Optional<Producto> optP = productoRepo.buscarPorId(id);
                        if (optP.isEmpty() || optP.get().isEliminado()) { System.out.println("Producto inválido."); break; }
                        Producto p = optP.get();
                        System.out.println("Nombre actual: " + p.getNombre());
                        System.out.print("Nuevo nombre (enter para conservar): ");
                        String nuevo = scanner.nextLine(); if (!nuevo.isBlank()) p.setNombre(nuevo.trim());
                        System.out.println("Precio actual: " + p.getPrecio());
                        System.out.print("Nuevo precio (enter para conservar): ");
                        String nuevoPrecio = scanner.nextLine(); if (!nuevoPrecio.isBlank()) {
                            double np = Double.parseDouble(nuevoPrecio);
                            if (np <= 0) { System.out.println("Precio inválido. Modificación cancelada."); break; }
                            p.setPrecio(np);
                        }
                        System.out.println("Stock actual: " + p.getStock());
                        System.out.print("Nuevo stock (enter para conservar): ");
                        String nuevoStock = scanner.nextLine(); if (!nuevoStock.isBlank()) {
                            int ns = Integer.parseInt(nuevoStock);
                            if (ns < 0) { System.out.println("Stock inválido. Modificación cancelada."); break; }
                            p.setStock(ns);
                        }
                        System.out.println("Descripción actual: " + p.getDescripcion());
                        System.out.print("Nueva descripción (enter para conservar): ");
                        String nuevaDesc = scanner.nextLine();
                        if (!nuevaDesc.isBlank()) p.setDescripcion(nuevaDesc.trim());
                        System.out.println("Imagen actual: " + p.getImagen());
                        System.out.print("Nueva imagen (enter para conservar): ");
                        String nuevaImagen = scanner.nextLine();
                        if (!nuevaImagen.isBlank()) p.setImagen(nuevaImagen.trim());
                        System.out.println("Disponible actual: " + (p.getDisponible() ? "S" : "N"));
                        System.out.print("Disponible (S/N, enter para conservar): ");
                        String nuevoDisp = scanner.nextLine().trim();
                        if (!nuevoDisp.isBlank()) {
                            if (nuevoDisp.equalsIgnoreCase("S")) {
                                p.setDisponible(true);
                            } else if (nuevoDisp.equalsIgnoreCase("N")) {
                                p.setDisponible(false);
                            } else {
                                System.out.println("Valor inválido. Se conserva el anterior.");
                            }
                        }
                        productoRepo.guardar(p);
                        System.out.println("Producto actualizado.");
                    } catch (NumberFormatException e) {
                        System.out.println("Entrada inválida.");
                    }
                }
                case "4" -> {
                    List<Producto> prods = productoRepo.listarActivos();
                    System.out.println("\nProductos activos:");
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre", "Precio", "Stock", "Categoría" },
                        prods.stream().map(pr -> new String[]{
                            String.valueOf(pr.getId()),
                            pr.getNombre(),
                            String.format("%.2f", pr.getPrecio()),
                            String.valueOf(pr.getStock()),
                            pr.getCategoria() != null ? pr.getCategoria().getNombre() : "-"
                        }).toList()
                    );
                }
                case "0" -> { return; }
                default -> System.out.println("Opción inválida.");
            }
        }
    }

    private static void usuariosMenu(Scanner scanner, UsuarioRepository usuarioRepo) {
        while (true) {
            System.out.println("\n--- Usuarios ---");
            System.out.println("1) Alta");
            System.out.println("2) Baja lógica");
            System.out.println("3) Modificación");
            System.out.println("4) Listado");
            System.out.println("5) Buscar por mail");
            System.out.println("0) Volver");
            System.out.print("Opción: ");
            String opt = scanner.nextLine().trim();

            switch (opt) {
                case "1" -> {
                    System.out.print("Nombre: ");
                    String nombre = scanner.nextLine().trim();
                    if (nombre.isEmpty()) {
                        System.out.println("El nombre no puede estar vacío.");
                        break;
                    }
                    System.out.print("Apellido: ");
                    String apellido = scanner.nextLine().trim();
                    if (apellido.isEmpty()) {
                        System.out.println("El apellido no puede estar vacío.");
                        break;
                    }
                    System.out.print("Mail: ");
                    String mail = scanner.nextLine().trim().toLowerCase();
                    if (mail.isEmpty()) {
                        System.out.println("El mail no puede estar vacío.");
                        break;
                    }
                    if (usuarioRepo.buscarPorMail(mail).isPresent()) {
                        System.out.println("Ya existe un usuario activo con ese mail.");
                        break;
                    }
                    System.out.print("Celular: ");
                    String celular = scanner.nextLine().trim();
                    System.out.print("Contraseña: ");
                    String contrasena = scanner.nextLine().trim();
                    if (contrasena.isEmpty()) {
                        System.out.println("La contraseña no puede estar vacía.");
                        break;
                    }
                    System.out.print("Rol (1=ADMIN, 2=USUARIO): ");
                    String rolOpt = scanner.nextLine().trim();
                    Rol rol;
                    if ("1".equals(rolOpt)) {
                        rol = Rol.ADMIN;
                    } else if ("2".equals(rolOpt)) {
                        rol = Rol.USUARIO;
                    } else {
                        System.out.println("Rol inválido.");
                        break;
                    }
                    Usuario u = Usuario.builder()
                            .nombre(nombre).apellido(apellido).mail(mail)
                            .celular(celular).contrasena(contrasena).rol(rol)
                            .build();
                    Usuario saved = usuarioRepo.guardar(u);
                    System.out.println("Usuario guardado con ID: " + saved.getId());
                }
                case "2" -> {
                    List<Usuario> usuarios = usuarioRepo.listarActivos();
                    if (usuarios.isEmpty()) { System.out.println("No hay usuarios activos."); break; }
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre", "Apellido", "Mail", "Celular", "Rol" },
                        usuarios.stream().map(u -> new String[]{
                            String.valueOf(u.getId()), u.getNombre(), u.getApellido(),
                            u.getMail(), u.getCelular(), u.getRol().name()
                        }).toList()
                    );
                    System.out.print("ID a dar de baja: ");
                    String idStr = scanner.nextLine().trim();
                    try {
                        Long id = Long.parseLong(idStr);
                        Optional<Usuario> optU = usuarioRepo.buscarPorId(id);
                        if (optU.isEmpty() || optU.get().isEliminado()) {
                            System.out.println("El usuario con ID " + id + " no existe o ya está dado de baja.");
                            break;
                        }
                        Usuario usuario = optU.get();
                        boolean ok = usuarioRepo.eliminarLogico(id);
                        if (ok) {
                            System.out.println("Usuario dado de baja: " + usuario.getNombre() + " " + usuario.getApellido());
                        } else {
                            System.out.println("No se pudo dar de baja el usuario.");
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("ID inválido.");
                    }
                }
                case "3" -> {
                    List<Usuario> usuarios = usuarioRepo.listarActivos();
                    if (usuarios.isEmpty()) { System.out.println("No hay usuarios activos."); break; }
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre", "Apellido", "Mail", "Celular", "Rol" },
                        usuarios.stream().map(u -> new String[]{
                            String.valueOf(u.getId()), u.getNombre(), u.getApellido(),
                            u.getMail(), u.getCelular(), u.getRol().name()
                        }).toList()
                    );
                    System.out.print("ID a modificar: ");
                    String idStr = scanner.nextLine().trim();
                    try {
                        Long id = Long.parseLong(idStr);
                        Optional<Usuario> optU = usuarioRepo.buscarPorId(id);
                        if (optU.isEmpty() || optU.get().isEliminado()) {
                            System.out.println("ID no corresponde a un usuario activo.");
                            break;
                        }
                        Usuario u = optU.get();
                        System.out.println("Nombre actual: " + u.getNombre());
                        System.out.print("Nuevo nombre (enter para conservar): ");
                        String nuevo = scanner.nextLine();
                        if (!nuevo.isBlank()) u.setNombre(nuevo.trim());
                        System.out.println("Apellido actual: " + u.getApellido());
                        System.out.print("Nuevo apellido (enter para conservar): ");
                        String nuevoAp = scanner.nextLine();
                        if (!nuevoAp.isBlank()) u.setApellido(nuevoAp.trim());
                        System.out.println("Mail actual: " + u.getMail());
                        System.out.print("Nuevo mail (enter para conservar): ");
                        String nuevoMail = scanner.nextLine().trim().toLowerCase();
                        if (!nuevoMail.isBlank()) {
                            Optional<Usuario> existente = usuarioRepo.buscarPorMail(nuevoMail);
                            if (existente.isPresent() && !existente.get().getId().equals(id)) {
                                System.out.println("Ese mail ya está en uso por otro usuario.");
                                break;
                            }
                            u.setMail(nuevoMail);
                        }
                        System.out.println("Celular actual: " + u.getCelular());
                        System.out.print("Nuevo celular (enter para conservar): ");
                        String nuevoCel = scanner.nextLine();
                        if (!nuevoCel.isBlank()) u.setCelular(nuevoCel.trim());
                        System.out.print("Nueva contraseña (enter para conservar): ");
                        String nuevoPass = scanner.nextLine();
                        if (!nuevoPass.isBlank()) u.setContrasena(nuevoPass.trim());
                        usuarioRepo.guardar(u);
                        System.out.println("Usuario actualizado.");
                    } catch (NumberFormatException e) {
                        System.out.println("ID inválido.");
                    }
                }
                case "4" -> {
                    List<Usuario> usuarios = usuarioRepo.listarActivos();
                    if (usuarios.isEmpty()) {
                        System.out.println("No hay usuarios activos.");
                        break;
                    }
                    List<String[]> filas = usuarios.stream()
                        .map(u -> {
                            UsuarioDTO dto = UsuarioDTO.from(u);
                            return new String[]{
                                String.valueOf(u.getId()),
                                dto.nombre(),
                                dto.apellido(),
                                dto.mail(),
                                dto.celular(),
                                u.getRol().name()
                            };
                        }).toList();
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre", "Apellido", "Mail", "Celular", "Rol" },
                        filas
                    );
                }
                case "5" -> {
                    System.out.print("Ingrese el mail: ");
                    String mail = scanner.nextLine().trim().toLowerCase();
                    Optional<Usuario> optU = usuarioRepo.buscarPorMail(mail);
                    if (optU.isPresent()) {
                        Usuario u = optU.get();
                        UsuarioDTO dto = UsuarioDTO.from(u);
                        System.out.println("--- Datos del usuario ---");
                        System.out.println("ID: " + u.getId());
                        System.out.println("Nombre: " + dto.nombre());
                        System.out.println("Apellido: " + dto.apellido());
                        System.out.println("Mail: " + dto.mail());
                        System.out.println("Celular: " + dto.celular());
                        System.out.println("Rol: " + u.getRol().name());
                    } else {
                        System.out.println("No existe un usuario activo con ese mail.");
                    }
                }
                case "0" -> { return; }
                default -> System.out.println("Opción inválida.");
            }
        }
    }

    private static void pedidosMenu(Scanner scanner, PedidoRepository pedidoRepo, UsuarioRepository usuarioRepo, ProductoRepository productoRepo) {
        while (true) {
            System.out.println("\n--- Pedidos ---");
            System.out.println("1) Alta de pedido");
            System.out.println("2) Cambiar estado");
            System.out.println("3) Baja lógica");
            System.out.println("4) Listado");
            System.out.println("5) Pedidos por usuario");
            System.out.println("6) Pedidos por estado");
            System.out.println("0) Volver");
            System.out.print("Opción: ");
            String opt = scanner.nextLine().trim();

            switch (opt) {
                case "1" -> {
                    List<Usuario> usuarios = usuarioRepo.listarActivos();
                    if (usuarios.isEmpty()) { System.out.println("No hay usuarios activos. Alta cancelada."); break; }
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre", "Apellido", "Mail" },
                        usuarios.stream().map(u -> new String[]{
                            String.valueOf(u.getId()), u.getNombre(), u.getApellido(), u.getMail()
                        }).toList()
                    );
                    System.out.print("ID del usuario: ");
                    String uidStr = scanner.nextLine().trim();
                    Usuario usuario;
                    try {
                        Long uid = Long.parseLong(uidStr);
                        Optional<Usuario> optU = usuarioRepo.buscarPorId(uid);
                        if (optU.isEmpty() || optU.get().isEliminado()) {
                            System.out.println("Usuario inválido.");
                            break;
                        }
                        usuario = optU.get();
                    } catch (NumberFormatException e) {
                        System.out.println("ID inválido.");
                        break;
                    }

                    System.out.println("Forma de pago:");
                    System.out.println("1) TARJETA");
                    System.out.println("2) TRANSFERENCIA");
                    System.out.println("3) EFECTIVO");
                    System.out.print("Opción: ");
                    String fpStr = scanner.nextLine().trim();
                    FormaPago formaPago;
                    if ("1".equals(fpStr)) {
                        formaPago = FormaPago.TARJETA;
                    } else if ("2".equals(fpStr)) {
                        formaPago = FormaPago.TRANSFERENCIA;
                    } else if ("3".equals(fpStr)) {
                        formaPago = FormaPago.EFECTIVO;
                    } else {
                        System.out.println("Forma de pago inválida.");
                        break;
                    }

                    Map<Long, Integer> items = new java.util.HashMap<>();
                    while (true) {
                        List<Producto> catalogo = productoRepo.listarActivos().stream()
                                .filter(p -> Boolean.TRUE.equals(p.getDisponible()))
                                .toList();
                        if (catalogo.isEmpty()) {
                            System.out.println("No hay productos activos y disponibles.");
                            break;
                        }
                        ConsoleTablePrinter.imprimirTabla(
                            new String[]{ "ID", "Nombre", "Precio", "Stock" },
                            catalogo.stream().map(p -> new String[]{
                                String.valueOf(p.getId()), p.getNombre(),
                                String.format("%.2f", p.getPrecio()), String.valueOf(p.getStock())
                            }).toList()
                        );
                        System.out.print("ID del producto (0 para terminar): ");
                        String pidStr = scanner.nextLine().trim();
                        if (pidStr.equals("0")) break;
                        try {
                            Long pid = Long.parseLong(pidStr);
                            Optional<Producto> optP = productoRepo.buscarPorId(pid);
                            if (optP.isEmpty() || optP.get().isEliminado()) {
                                System.out.println("Producto inválido.");
                                continue;
                            }
                            Producto prod = optP.get();
                            if (!Boolean.TRUE.equals(prod.getDisponible())) {
                                System.out.println("El producto no está disponible.");
                                continue;
                            }
                            System.out.print("Cantidad: ");
                            int cantidad = Integer.parseInt(scanner.nextLine().trim());
                            if (cantidad <= 0) {
                                System.out.println("La cantidad debe ser mayor a 0.");
                                continue;
                            }
                            if (prod.getStock() < cantidad) {
                                System.out.println("Stock insuficiente. Disponible: " + prod.getStock());
                                continue;
                            }
                            items.put(pid, items.getOrDefault(pid, 0) + cantidad);
                            System.out.println("Producto agregado.");
                        } catch (NumberFormatException e) {
                            System.out.println("Entrada inválida.");
                        }
                    }

                    if (items.isEmpty()) {
                        System.out.println("El pedido debe tener al menos un producto. Alta cancelada.");
                        break;
                    }

                    try {
                        Pedido pedido = pedidoRepo.crearPedido(usuario, formaPago, items);
                        System.out.println("\n--- Pedido creado ---");
                        System.out.println("ID: " + pedido.getId());
                        System.out.println("Fecha: " + pedido.getFecha());
                        System.out.println("Usuario: " + usuario.getNombre() + " " + usuario.getApellido());
                        System.out.println("Forma de pago: " + formaPago.name());
                        System.out.println("Productos:");
                        for (DetallePedido d : pedido.getDetalles()) {
                            System.out.println("  - " + d.getProducto().getNombre()
                                    + " x" + d.getCantidad()
                                    + " = $" + String.format("%.2f", d.getSubtotal()));
                        }
                        System.out.println("Total: $" + String.format("%.2f", pedido.getTotal()));
                    } catch (RuntimeException e) {
                        System.out.println("Error al crear el pedido: " + e.getMessage());
                    }
                }
                case "2" -> {
                    List<Pedido> pedidos = pedidoRepo.listarActivos();
                    if (pedidos.isEmpty()) {
                        System.out.println("No hay pedidos activos.");
                        break;
                    }
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Fecha", "Estado", "Usuario", "Total" },
                        pedidos.stream().map(p -> new String[]{
                            String.valueOf(p.getId()),
                            p.getFecha().toString(),
                            p.getEstado().name(),
                            p.getUsuario().getNombre() + " " + p.getUsuario().getApellido(),
                            String.format("%.2f", p.getTotal())
                        }).toList()
                    );
                    System.out.print("ID del pedido: ");
                    String idStr = scanner.nextLine().trim();
                    try {
                        Long id = Long.parseLong(idStr);
                        Optional<Pedido> optP = pedidoRepo.buscarPorId(id);
                        if (optP.isEmpty() || optP.get().isEliminado()) {
                            System.out.println("El pedido con ID " + id + " no existe o ya está dado de baja.");
                            break;
                        }
                        Pedido pedido = optP.get();
                        System.out.println("Estado actual: " + pedido.getEstado().name());
                        System.out.println("Nuevo estado:");
                        System.out.println("1) PENDIENTE");
                        System.out.println("2) CONFIRMADO");
                        System.out.println("3) TERMINADO");
                        System.out.println("4) CANCELADO");
                        System.out.print("Opción: ");
                        String estadoOpt = scanner.nextLine().trim();
                        Estado nuevoEstado = switch (estadoOpt) {
                            case "1" -> Estado.PENDIENTE;
                            case "2" -> Estado.CONFIRMADO;
                            case "3" -> Estado.TERMINADO;
                            case "4" -> Estado.CANCELADO;
                            default -> null;
                        };
                        if (nuevoEstado == null) {
                            System.out.println("Opción inválida.");
                            break;
                        }
                        pedido.setEstado(nuevoEstado);
                        pedidoRepo.guardar(pedido);
                        System.out.println("Pedido ID " + pedido.getId() + " actualizado a " + nuevoEstado.name() + ".");
                    } catch (NumberFormatException e) {
                        System.out.println("ID inválido.");
                    }
                }
                case "3" -> {
                    List<Pedido> pedidos = pedidoRepo.listarActivos();
                    if (pedidos.isEmpty()) {
                        System.out.println("No hay pedidos activos.");
                        break;
                    }
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Fecha", "Estado", "Usuario", "Total" },
                        pedidos.stream().map(p -> new String[]{
                            String.valueOf(p.getId()),
                            p.getFecha().toString(),
                            p.getEstado().name(),
                            p.getUsuario().getNombre() + " " + p.getUsuario().getApellido(),
                            String.format("%.2f", p.getTotal())
                        }).toList()
                    );
                    System.out.print("ID del pedido a dar de baja: ");
                    String idStr = scanner.nextLine().trim();
                    try {
                        Long id = Long.parseLong(idStr);
                        Optional<Pedido> optP = pedidoRepo.buscarPorId(id);
                        if (optP.isEmpty() || optP.get().isEliminado()) {
                            System.out.println("El pedido con ID " + id + " no existe o ya está dado de baja.");
                            break;
                        }
                        Pedido pedido = optP.get();
                        boolean ok = pedidoRepo.eliminarLogico(id);
                        if (ok) {
                            System.out.println("Pedido ID " + pedido.getId() + " con total $" + String.format("%.2f", pedido.getTotal()) + " dado de baja.");
                        } else {
                            System.out.println("No se pudo dar de baja el pedido.");
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("ID inválido.");
                    }
                }
                case "4" -> {
                    List<Pedido> pedidosListado = pedidoRepo.listarActivos();
                    if (pedidosListado.isEmpty()) {
                        System.out.println("No hay pedidos activos.");
                        break;
                    }
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Fecha", "Estado", "Forma de pago", "Usuario", "Total" },
                        pedidosListado.stream().map(p -> new String[]{
                            String.valueOf(p.getId()),
                            p.getFecha().toString(),
                            p.getEstado().name(),
                            p.getFormaPago().name(),
                            p.getUsuario().getNombre() + " " + p.getUsuario().getApellido(),
                            String.format("%.2f", p.getTotal())
                        }).toList()
                    );
                }
                case "5" -> {
                    List<Usuario> usuariosPorPedido = usuarioRepo.listarActivos();
                    if (usuariosPorPedido.isEmpty()) { System.out.println("No hay usuarios activos."); break; }
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre", "Apellido", "Mail" },
                        usuariosPorPedido.stream().map(u -> new String[]{
                            String.valueOf(u.getId()), u.getNombre(), u.getApellido(), u.getMail()
                        }).toList()
                    );
                    System.out.print("ID del usuario: ");
                    String idUserPed = scanner.nextLine().trim();
                    try {
                        Long idPedUser = Long.parseLong(idUserPed);
                        String nombreUsuarioPed = usuariosPorPedido.stream()
                            .filter(u -> u.getId().equals(idPedUser))
                            .map(u -> u.getNombre() + " " + u.getApellido())
                            .findFirst()
                            .orElse("Usuario " + idPedUser);
                        List<Pedido> pedidosDeUsuario = usuarioRepo.buscarPedidosPorUsuario(idPedUser);
                        if (pedidosDeUsuario.isEmpty()) {
                            System.out.println("El usuario " + nombreUsuarioPed + " no tiene pedidos activos.");
                        } else {
                            ConsoleTablePrinter.imprimirTablaConTitulo(
                                "Pedidos de: " + nombreUsuarioPed,
                                new String[]{ "ID", "Fecha", "Estado", "Forma de pago", "Total" },
                                pedidosDeUsuario.stream().map(p -> new String[]{
                                    String.valueOf(p.getId()),
                                    p.getFecha().toString(),
                                    p.getEstado().name(),
                                    p.getFormaPago().name(),
                                    String.format("%.2f", p.getTotal())
                                }).toList()
                            );
                        }
                    } catch (NumberFormatException e) { System.out.println("ID inválido."); }
                }
                case "6" -> {
                    System.out.println("Estados:");
                    System.out.println("1) PENDIENTE");
                    System.out.println("2) CONFIRMADO");
                    System.out.println("3) TERMINADO");
                    System.out.println("4) CANCELADO");
                    System.out.print("Opción: ");
                    String estadoPedOpt = scanner.nextLine().trim();
                    Estado estadoPed = switch (estadoPedOpt) {
                        case "1" -> Estado.PENDIENTE;
                        case "2" -> Estado.CONFIRMADO;
                        case "3" -> Estado.TERMINADO;
                        case "4" -> Estado.CANCELADO;
                        default -> null;
                    };
                    if (estadoPed == null) {
                        System.out.println("Opción inválida.");
                        break;
                    }
                    List<Pedido> pedidosPorEstado = pedidoRepo.buscarPorEstado(estadoPed);
                    if (pedidosPorEstado.isEmpty()) {
                        System.out.println("No hay pedidos con estado " + estadoPed.name() + ".");
                    } else {
                        ConsoleTablePrinter.imprimirTablaConTitulo(
                            "Pedidos con estado " + estadoPed.name(),
                            new String[]{ "ID", "Fecha", "Usuario", "Total" },
                            pedidosPorEstado.stream().map(p -> new String[]{
                                String.valueOf(p.getId()),
                                p.getFecha().toString(),
                                p.getUsuario().getNombre() + " " + p.getUsuario().getApellido(),
                                String.format("%.2f", p.getTotal())
                            }).toList()
                        );
                    }
                }
                case "0" -> { return; }
                default -> System.out.println("Opción inválida.");
            }
        }
    }

    private static void reportesMenu(Scanner scanner, ProductoRepository productoRepo, CategoriaRepository categoriaRepo, UsuarioRepository usuarioRepo, PedidoRepository pedidoRepo) {
        while (true) {
            System.out.println("\n--- Reportes ---");
            System.out.println("1) Productos por categoría");
            System.out.println("2) Pedidos por usuario");
            System.out.println("3) Pedidos por estado");
            System.out.println("4) Total facturado");
            System.out.println("0) Volver");
            System.out.print("Opción: ");
            String opt = scanner.nextLine().trim();
            switch (opt) {
                case "1" -> {
                    List<Categoria> cats = categoriaRepo.listarActivos();
                    if (cats.isEmpty()) { System.out.println("No hay categorías activas."); break; }
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre" },
                        cats.stream().map(c -> new String[]{ String.valueOf(c.getId()), c.getNombre() }).toList()
                    );
                    System.out.print("ID categoría: ");
                    String idStr = scanner.nextLine().trim();
                    try {
                        Long id = Long.parseLong(idStr);
                        String tituloCat = cats.stream()
                                .filter(c -> c.getId().equals(id))
                                .map(Categoria::getNombre)
                                .findFirst()
                                .orElse("Categoría " + id);
                        List<Producto> productos = categoriaRepo.buscarProductosPorCategoria(id);
                        System.out.println();
                        ConsoleTablePrinter.imprimirTablaConTitulo(
                            "Categoría: " + tituloCat,
                            new String[]{ "ID", "Nombre", "Precio", "Stock" },
                            productos.stream().map(p -> new String[]{
                                String.valueOf(p.getId()),
                                p.getNombre(),
                                String.format("%.2f", p.getPrecio()),
                                String.valueOf(p.getStock())
                            }).toList()
                        );
                    } catch (NumberFormatException e) { System.out.println("ID inválido."); }
                }
                case "2" -> {
                    List<Usuario> usuarios = usuarioRepo.listarActivos();
                    if (usuarios.isEmpty()) { System.out.println("No hay usuarios activos."); break; }
                    ConsoleTablePrinter.imprimirTabla(
                        new String[]{ "ID", "Nombre", "Apellido", "Mail" },
                        usuarios.stream().map(u -> new String[]{
                            String.valueOf(u.getId()), u.getNombre(), u.getApellido(), u.getMail()
                        }).toList()
                    );
                    System.out.print("ID del usuario: ");
                    String idStr = scanner.nextLine().trim();
                    try {
                        Long id = Long.parseLong(idStr);
                        String nombreUsuario = usuarios.stream()
                                .filter(u -> u.getId().equals(id))
                                .map(u -> u.getNombre() + " " + u.getApellido())
                                .findFirst()
                                .orElse("Usuario " + id);
                        List<Pedido> pedidos = usuarioRepo.buscarPedidosPorUsuario(id);
                        if (pedidos.isEmpty()) {
                            System.out.println("El usuario " + nombreUsuario + " no tiene pedidos activos.");
                        } else {
                            ConsoleTablePrinter.imprimirTablaConTitulo(
                                "Pedidos de: " + nombreUsuario,
                                new String[]{ "ID", "Fecha", "Estado", "Forma de pago", "Total" },
                                pedidos.stream().map(p -> new String[]{
                                    String.valueOf(p.getId()),
                                    p.getFecha().toString(),
                                    p.getEstado().name(),
                                    p.getFormaPago().name(),
                                    String.format("%.2f", p.getTotal())
                                }).toList()
                            );
                        }
                    } catch (NumberFormatException e) { System.out.println("ID inválido."); }
                }
                case "3" -> {
                    System.out.println("Estados:");
                    System.out.println("1) PENDIENTE");
                    System.out.println("2) CONFIRMADO");
                    System.out.println("3) TERMINADO");
                    System.out.println("4) CANCELADO");
                    System.out.print("Opción: ");
                    String estStr = scanner.nextLine().trim();
                    Estado estado = switch (estStr) {
                        case "1" -> Estado.PENDIENTE;
                        case "2" -> Estado.CONFIRMADO;
                        case "3" -> Estado.TERMINADO;
                        case "4" -> Estado.CANCELADO;
                        default -> null;
                    };
                    if (estado == null) {
                        System.out.println("Opción inválida.");
                        break;
                    }
                    List<Pedido> pedidos = pedidoRepo.buscarPorEstadoConUsuario(estado);
                    if (pedidos.isEmpty()) {
                        System.out.println("No hay pedidos con estado " + estado.name() + ".");
                    } else {
                        ConsoleTablePrinter.imprimirTablaConTitulo(
                            "Pedidos con estado " + estado.name(),
                            new String[]{ "ID", "Fecha", "Usuario", "Total" },
                            pedidos.stream().map(p -> new String[]{
                                String.valueOf(p.getId()),
                                p.getFecha().toString(),
                                p.getUsuario().getNombre() + " " + p.getUsuario().getApellido(),
                                String.format("%.2f", p.getTotal())
                            }).toList()
                        );
                    }
                }
                case "4" -> {
                    List<Pedido> terminados = pedidoRepo.buscarPorEstado(Estado.TERMINADO);
                    double total = terminados.stream()
                            .mapToDouble(p -> p.getTotal() != null ? p.getTotal() : 0.0)
                            .sum();
                    System.out.println("Total facturado: " + String.format(Locale.US, "$%.2f", total));
                }
                case "0" -> { return; }
                default -> System.out.println("Opción inválida.");
            }
        }
    }
}