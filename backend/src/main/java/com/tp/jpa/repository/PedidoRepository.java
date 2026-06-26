package com.tp.jpa.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.tp.jpa.model.DetallePedido;
import com.tp.jpa.model.Pedido;
import com.tp.jpa.model.Producto;
import com.tp.jpa.model.Usuario;
import com.tp.jpa.model.enums.Estado;
import com.tp.jpa.model.enums.FormaPago;
import com.tp.jpa.util.JPAUtil;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;

public class PedidoRepository extends BaseRepository<Pedido> {

    public PedidoRepository() {
        super(Pedido.class);
    }

    public List<Pedido> buscarPorEstado(Estado estado) {
        EntityManager entityManager = JPAUtil.getEntityManagerFactory().createEntityManager();
        try {
            // Consulta JPQL: retorna todos los pedidos activos con un estado específico.
            // Útil para filtrar PENDIENTE, CONFIRMADO, TERMINADO o CANCELADO.
            String jpql = "SELECT p FROM Pedido p WHERE p.estado = :estado AND p.eliminado = false";
            return entityManager.createQuery(jpql, Pedido.class)
                    .setParameter("estado", estado)
                    .getResultList();
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }

    public List<Pedido> buscarPorEstadoConUsuario(Estado estado) {
        EntityManager entityManager = JPAUtil.getEntityManagerFactory().createEntityManager();
        try {
            // Consulta JPQL: retorna pedidos activos con un estado específico,
            // con JOIN FETCH para traer el usuario en la misma consulta
            // y evitar LazyInitializationException fuera de la transacción.
            String jpql = "SELECT p FROM Pedido p JOIN FETCH p.usuario WHERE p.estado = :estado AND p.eliminado = false";
            return entityManager.createQuery(jpql, Pedido.class)
                    .setParameter("estado", estado)
                    .getResultList();
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }

    /**
     * Crea un pedido con sus detalles en una única transacción atómica.
     * Si falla cualquier validación (stock insuficiente, producto no disponible),
     * se hace rollback completo y no se modifica nada en la BD.
     */
    public Pedido crearPedido(Usuario usuario, FormaPago formaPago, Map<Long, Integer> items) {
        EntityManager entityManager = JPAUtil.getEntityManagerFactory().createEntityManager();
        EntityTransaction transaction = entityManager.getTransaction();

        try {
            transaction.begin();

            Usuario usuarioGestionado = entityManager.merge(usuario);

            Pedido pedido = Pedido.builder()
                    .fecha(LocalDate.now())
                    .estado(Estado.PENDIENTE)
                    .formaPago(formaPago)
                    .build();
            pedido.setUsuario(usuarioGestionado);

            for (Map.Entry<Long, Integer> entry : items.entrySet()) {
                Producto producto = entityManager.find(Producto.class, entry.getKey());
                if (producto == null || producto.isEliminado()) {
                    throw new RuntimeException("Producto con ID " + entry.getKey() + " no encontrado.");
                }
                if (!producto.getDisponible()) {
                    throw new RuntimeException("El producto " + producto.getNombre() + " no está disponible.");
                }
                int cantidad = entry.getValue();
                if (producto.getStock() < cantidad) {
                    throw new RuntimeException("Stock insuficiente para " + producto.getNombre()
                            + ". Disponible: " + producto.getStock() + ", solicitado: " + cantidad);
                }
                pedido.addDetallePedido(cantidad, producto);
                producto.setStock(producto.getStock() - cantidad);
            }

            entityManager.persist(pedido);
            transaction.commit();
            return pedido;

        } catch (RuntimeException e) {
            if (transaction.isActive()) {
                transaction.rollback();
            }
            throw e;
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }

    @Override
    public List<Pedido> listarActivos() {
        EntityManager entityManager = JPAUtil.getEntityManagerFactory().createEntityManager();
        try {
            String jpql = "SELECT p FROM Pedido p JOIN FETCH p.usuario WHERE p.eliminado = false";
            return entityManager.createQuery(jpql, Pedido.class).getResultList();
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }
}
