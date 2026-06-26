package com.tp.jpa.model;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@ToString
@SuperBuilder
@Entity

public class Categoria extends Base {
  @EqualsAndHashCode.Include
  private String nombre;
  private String descripcion;

  @OneToMany(mappedBy = "categoria")
  @Builder.Default
  @ToString.Exclude
  private Set<Producto> productos = new HashSet<>();
}
