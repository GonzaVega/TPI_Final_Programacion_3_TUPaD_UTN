package com.tp.jpa.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.FetchType;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@ToString
@Entity

public class DetallePedido extends Base {
  private int cantidad;

  
  @EqualsAndHashCode.Include
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "producto_id")
  private Producto producto;
  
  @EqualsAndHashCode.Include
  private Double subtotal;
  
  public DetallePedido(int cantidad, Producto producto) {
    super();
    this.cantidad = cantidad;
    this.producto = producto;
    this.subtotal = cantidad * producto.getPrecio();
  }
}
