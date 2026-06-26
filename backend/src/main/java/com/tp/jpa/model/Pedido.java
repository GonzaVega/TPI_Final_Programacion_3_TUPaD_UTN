package com.tp.jpa.model;

import java.time.LocalDate;
import java.util.Set;
import java.util.HashSet;

import com.tp.jpa.model.enums.Estado;
import com.tp.jpa.model.enums.FormaPago;
import com.tp.jpa.model.Calculable;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.EnumType;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@NoArgsConstructor
@Setter
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)  
@SuperBuilder
@ToString
@Entity


public class Pedido extends Base implements Calculable {
  @EqualsAndHashCode.Include
  private LocalDate fecha;

  @EqualsAndHashCode.Include
  @Enumerated(EnumType.STRING)
  private Estado estado;
  
  @Builder.Default
  private Double  total = 0.0;
  
  @EqualsAndHashCode.Include
  @Enumerated(EnumType.STRING)
  private FormaPago formaPago;

  // NOTA (Obs 4): La consigna TPI especifica relación unidireccional
  // Usuario -> Pedido con @JoinColumn en Usuario, y Pedido no debería
  // conocer a Usuario. Sin embargo, el listado de pedidos debe mostrar el
  // nombre del usuario asociado, y el alta de pedido necesita navegar de
  // Pedido a Usuario. Se mantiene @ManyToOne en Pedido para que ambas
  // funcionalidades sean viables dentro de una misma transacción.
  @EqualsAndHashCode.Include
  @ToString.Exclude
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "usuario_id")
  private Usuario usuario;
  
  @Builder.Default
  @OneToMany(cascade = CascadeType.ALL)
  @JoinColumn(name = "pedido_id")
  private Set<DetallePedido> detalles = new HashSet<>();

  public void addDetallePedido(int cantidad, Producto producto) {
    DetallePedido detalle = new DetallePedido(cantidad, producto);
    detalles.add(detalle);
    calcularTotal();
  }

  public DetallePedido findDetallePedidoByProducto(Producto producto) {
    DetallePedido buscado = this.detalles.stream()
                            .filter(detalle -> detalle.getProducto().equals(producto))
                            .findFirst()
                            .orElse(null);
   return buscado;
  }

  public void deleteDetallePedidoByProducto(Producto producto) {
    DetallePedido eliminado = this.detalles.stream()
                            .filter(detalle -> detalle.getProducto().equals(producto))
                            .findFirst()
                            .orElse(null);

    if (eliminado != null) {
      this.detalles.remove(eliminado);
      calcularTotal();
    }
  }

  @Override
  public void calcularTotal() {
    if (detalles == null || detalles.isEmpty()) {
      this.total = 0.0;
      return;
    }
    this.total = 0.0;
    for (DetallePedido detalle : detalles) {
      this.total += detalle.getSubtotal();
    }
  }
}
