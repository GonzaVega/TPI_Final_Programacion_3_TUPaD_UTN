package com.tp.jpa.repository;

import java.util.List;

import com.tp.jpa.model.Categoria;
import com.tp.jpa.model.Producto;
import com.tp.jpa.util.JPAUtil;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;

public class ProductoRepository extends BaseRepository<Producto> {

    public ProductoRepository() {
        super(Producto.class);
    }

    /**
     * Sobreescribe guardar() para re-attachar la Categoria al EntityManager
     * antes de hacer merge del Producto. Esto evita el TransientPropertyValueException
     * que ocurre porque la Categoria fue cargada en un EntityManager anterior (ya cerrado)
     * y JPA la considera detached/transient en el nuevo contexto de persistencia.
     */
    @Override
    public Producto guardar(Producto producto) {
        EntityManager entityManager = JPAUtil.getEntityManagerFactory().createEntityManager();
        EntityTransaction transaction = entityManager.getTransaction();

        try {
            transaction.begin();

            if (producto.getCategoria() != null && producto.getCategoria().getId() != null) {
                Categoria categoriaAttached = entityManager.merge(producto.getCategoria());
                producto.setCategoria(categoriaAttached);
            }

            Producto saved = entityManager.merge(producto);
            transaction.commit();
            return saved;
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

    public List<Producto> buscarPorCategoria(Long categoriaId) {
        EntityManager entityManager = JPAUtil.getEntityManagerFactory().createEntityManager();

        try {
            String jpql = "SELECT p FROM Producto p WHERE p.categoria.id = :categoriaId AND p.eliminado = false";
            return entityManager.createQuery(jpql, Producto.class)
                    .setParameter("categoriaId", categoriaId)
                    .getResultList();
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }

    @Override
    public List<Producto> listarActivos() {
        EntityManager entityManager = JPAUtil.getEntityManagerFactory().createEntityManager();
        try {
            String jpql = "SELECT p FROM Producto p JOIN FETCH p.categoria WHERE p.eliminado = false";
            return entityManager.createQuery(jpql, Producto.class).getResultList();
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }
}