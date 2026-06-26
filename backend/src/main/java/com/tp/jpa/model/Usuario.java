package com.tp.jpa.model;

import java.util.Set;
import java.util.HashSet;

import com.tp.jpa.model.enums.Rol;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@ToString
@Entity

public class Usuario extends Base {
  private String nombre;
  private String apellido;

  @EqualsAndHashCode.Include
  @Column(unique = true)
  private String mail;

  private String celular;
  private String contrasena;

  @Enumerated(EnumType.STRING)
  private Rol rol;

  @Builder.Default
  @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
  private Set<Pedido> pedidos = new HashSet<>();

  public void agregarPedido(Pedido pedido) {
    if (pedido == null) return;
    pedido.setUsuario(this);
    this.pedidos.add(pedido);
  }
}