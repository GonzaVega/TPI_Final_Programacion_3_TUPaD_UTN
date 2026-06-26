package com.tp.jpa.util;

import com.tp.jpa.model.Categoria;
import com.tp.jpa.model.Producto;
import com.tp.jpa.model.Usuario;
import com.tp.jpa.model.Pedido;
import com.tp.jpa.model.enums.Estado;
import com.tp.jpa.model.enums.FormaPago;
import com.tp.jpa.model.enums.Rol;
import com.tp.jpa.repository.CategoriaRepository;
import com.tp.jpa.repository.ProductoRepository;

import jakarta.persistence.EntityManager;

import java.time.LocalDate;
import java.util.List;

public final class DataSeeder {

    private DataSeeder() {}

    public static void seedIfNeeded() {
        CategoriaRepository categoriaRepo = new CategoriaRepository();
        ProductoRepository productoRepo = new ProductoRepository();

        List<Categoria> categorias = categoriaRepo.listarActivos();
        if (!categorias.isEmpty()) return; 

        Categoria c1 = Categoria.builder().nombre("Electrónica").descripcion("Dispositivos electrónicos y gadgets").build();
        Categoria c2 = Categoria.builder().nombre("Ropa").descripcion("Prendas de vestir").build();
        Categoria c3 = Categoria.builder().nombre("Hogar").descripcion("Artículos para el hogar").build();

        Producto p1 = Producto.builder().nombre("Smartphone").precio(599.99).descripcion("Teléfono inteligente").stock(10).disponible(true).build();
        Producto p2 = Producto.builder().nombre("Remera").precio(19.99).descripcion("Remera de algodón").stock(50).disponible(true).build();
        Producto p3 = Producto.builder().nombre("Notebook").precio(999.99).descripcion("Computadora portátil").stock(5).disponible(true).build();

        // Se asocia vía setCategoria() y se persisten los productos por separado.
        // La relación es bidireccional: Categoria tiene @OneToMany(mappedBy = "categoria")
        // y Producto tiene @ManyToOne. El lado owning es Producto.
        p1.setCategoria(c1);
        p3.setCategoria(c1);
        p2.setCategoria(c2);

        categoriaRepo.guardar(c1);
        categoriaRepo.guardar(c2);
        categoriaRepo.guardar(c3);

        productoRepo.guardar(p1);
        productoRepo.guardar(p2);
        productoRepo.guardar(p3);

        EntityManager em = JPAUtil.getEntityManagerFactory().createEntityManager();
        try {
            List<Usuario> usuariosExistentes = em.createQuery("SELECT u FROM Usuario u", Usuario.class).getResultList();
            if (!usuariosExistentes.isEmpty()) return;

            em.getTransaction().begin();

            Usuario usuario1 = Usuario.builder()
                    .nombre("Juan")
                    .apellido("Perez")
                    .mail("juan@perez.com")
                    .celular("123456789")
                    .contrasena("password123")
                    .rol(Rol.USUARIO)
                    .build();

            Usuario usuario2 = Usuario.builder()
                    .nombre("Maria")
                    .apellido("Gomez")
                    .mail("maria@gomez.com")
                    .celular("987654321")
                    .contrasena("password456")
                    .rol(Rol.ADMIN)
                    .build();

            List<Producto> productos = productoRepo.listarActivos();
            Producto prod1 = productos.stream().filter(p -> "Smartphone".equals(p.getNombre())).findFirst().orElse(null);
            Producto prod2 = productos.stream().filter(p -> "Remera".equals(p.getNombre())).findFirst().orElse(null);
            Producto prod3 = productos.stream().filter(p -> "Notebook".equals(p.getNombre())).findFirst().orElse(null);

            Pedido pedido1 = Pedido.builder()
                    .fecha(LocalDate.now())
                    .estado(Estado.PENDIENTE)
                    .formaPago(FormaPago.TARJETA)
                    .build();

            Pedido pedido2 = Pedido.builder()
                    .fecha(LocalDate.now())
                    .estado(Estado.TERMINADO)
                    .formaPago(FormaPago.EFECTIVO)
                    .build();

            Pedido pedido3 = Pedido.builder()
                    .fecha(LocalDate.now())
                    .estado(Estado.CANCELADO)
                    .formaPago(FormaPago.TRANSFERENCIA)
                    .build();

            usuario1.agregarPedido(pedido1);
            usuario1.agregarPedido(pedido2);
            usuario2.agregarPedido(pedido3);

            if (prod1 != null) pedido1.addDetallePedido(2, prod1);
            if (prod2 != null) pedido1.addDetallePedido(1, prod2);
            if (prod3 != null) pedido2.addDetallePedido(1, prod3);

            em.persist(usuario1);
            em.persist(usuario2);

            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) em.getTransaction().rollback();
        } finally {
            if (em.isOpen()) em.close();
        }
    }
}
