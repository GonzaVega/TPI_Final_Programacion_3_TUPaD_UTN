package com.tp.jpa.repository;

import java.util.List;
import java.util.Optional;

import com.tp.jpa.model.Base;
import com.tp.jpa.util.JPAUtil;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;

public abstract class BaseRepository<T extends Base> {

    private final Class<T> entityClass;
    private final EntityManagerFactory entityManagerFactory;

    protected BaseRepository(Class<T> entityClass) {
        this.entityClass = entityClass;
        this.entityManagerFactory = JPAUtil.getEntityManagerFactory();
    }

    public T guardar(T entity) {
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        EntityTransaction transaction = entityManager.getTransaction();

        try {
            transaction.begin();
            if (entity.getId() == null) {
                entityManager.persist(entity);
                transaction.commit();
                return entity;
            } else {
                T savedEntity = entityManager.merge(entity);
                transaction.commit();
                return savedEntity;
            }
        } catch (RuntimeException exception) {
            if (transaction.isActive()) {
                transaction.rollback();
            }
            throw exception;
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }

    public Optional<T> buscarPorId(Long id) {
        EntityManager entityManager = entityManagerFactory.createEntityManager();

        try {
            T entity = entityManager.find(entityClass, id);
            return entity == null ? Optional.empty() : Optional.of(entity);
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }

    public List<T> listarActivos() {
        EntityManager entityManager = entityManagerFactory.createEntityManager();

        try {
            String jpql = "SELECT e FROM " + entityClass.getSimpleName() + " e WHERE e.eliminado = false";
            return entityManager.createQuery(jpql, entityClass).getResultList();
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }

    public boolean eliminarLogico(Long id) {
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        EntityTransaction transaction = entityManager.getTransaction();

        try {
            T entity = entityManager.find(entityClass, id);
            if (entity == null || entity.isEliminado()) {
                return false;
            }

            transaction.begin();
            entity.setEliminado(true);
            entityManager.merge(entity);
            transaction.commit();
            return true;
        } catch (RuntimeException exception) {
            if (transaction.isActive()) {
                transaction.rollback();
            }
            throw exception;
        } finally {
            if (entityManager.isOpen()) {
                entityManager.close();
            }
        }
    }
}