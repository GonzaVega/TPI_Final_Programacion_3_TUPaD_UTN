package com.tp.jpa.repository;

import java.util.List;

import com.tp.jpa.model.Categoria;
import com.tp.jpa.model.Producto;
import com.tp.jpa.util.JPAUtil;

import jakarta.persistence.EntityManager;

public class CategoriaRepository extends BaseRepository<Categoria> {

    public CategoriaRepository() {
        super(Categoria.class);
    }

    public List<Producto> buscarProductosPorCategoria(Long categoriaId) {
        EntityManager entityManager = JPAUtil.getEntityManagerFactory().createEntityManager();
        try {
            // Consulta JPQL: retorna los productos activos de una categoría.
            // Se navega desde Categoria hacia su colección c.productos mediante JOIN.
            // Se filtra por el id de la categoría (parámetro nombrado :catId) y
            // por p.eliminado = false para excluir las bajas lógicas.
            String jpql = "SELECT p FROM Categoria c JOIN c.productos p WHERE c.id = :catId AND p.eliminado = false";
            return entityManager.createQuery(jpql, Producto.class)
                    .setParameter("catId", categoriaId)
                    .getResultList();
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }
}