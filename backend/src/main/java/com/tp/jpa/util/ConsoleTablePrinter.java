package com.tp.jpa.util;

import java.util.List;

public class ConsoleTablePrinter {

    private ConsoleTablePrinter() {}

    public static int[] calcularAnchos(String[] headers, List<String[]> filas) {
        int[] anchos = new int[headers.length];
        for (int i = 0; i < headers.length; i++) {
            anchos[i] = headers[i].length();
        }
        for (String[] fila : filas) {
            for (int i = 0; i < fila.length && i < anchos.length; i++) {
                if (fila[i] != null && fila[i].length() > anchos[i]) {
                    anchos[i] = fila[i].length();
                }
            }
        }
        return anchos;
    }

    public static String filaSeparadora(int[] anchos) {
        StringBuilder sb = new StringBuilder("+");
        for (int a : anchos) {
            sb.append("-".repeat(a + 2)).append("+");
        }
        return sb.toString();
    }

    public static String filaTabla(String[] celdas, int[] anchos) {
        StringBuilder sb = new StringBuilder("|");
        for (int i = 0; i < celdas.length; i++) {
            sb.append(String.format(" %-" + anchos[i] + "s |", celdas[i]));
        }
        return sb.toString();
    }

    public static void imprimirTabla(String[] headers, List<String[]> filas) {
        int[] anchos = calcularAnchos(headers, filas);
        String sep = filaSeparadora(anchos);
        System.out.println(sep);
        System.out.println(filaTabla(headers, anchos));
        System.out.println(sep);
        if (filas.isEmpty()) {
            int totalAncho = 1;
            for (int a : anchos) totalAncho += a + 3;
            String msg = "Sin registros";
            int pad = (totalAncho - 2 - msg.length()) / 2;
            System.out.println("|" + " ".repeat(pad) + msg + " ".repeat(totalAncho - 2 - pad - msg.length()) + "|");
        } else {
            for (String[] fila : filas) {
                System.out.println(filaTabla(fila, anchos));
            }
        }
        System.out.println(sep);
    }

    public static void imprimirTablaConTitulo(String titulo, String[] headers, List<String[]> filas) {
        int[] anchos = calcularAnchos(headers, filas);
        int totalAncho = 1;
        for (int a : anchos) totalAncho += a + 3;
        String sep = filaSeparadora(anchos);
        int pad = (totalAncho - 2 - titulo.length()) / 2;
        if (pad < 0) pad = 0;
        int rpad = totalAncho - 2 - pad - titulo.length();
        if (rpad < 0) rpad = 0;
        System.out.println(sep);
        System.out.println("|" + " ".repeat(pad) + titulo + " ".repeat(rpad) + "|");
        System.out.println(sep);
        System.out.println(filaTabla(headers, anchos));
        System.out.println(sep);
        if (filas.isEmpty()) {
            String msg = "Sin productos en esta categoría";
            int p2 = (totalAncho - 2 - msg.length()) / 2;
            if (p2 < 0) p2 = 0;
            int r2 = totalAncho - 2 - p2 - msg.length();
            if (r2 < 0) r2 = 0;
            System.out.println("|" + " ".repeat(p2) + msg + " ".repeat(r2) + "|");
        } else {
            for (String[] fila : filas) {
                System.out.println(filaTabla(fila, anchos));
            }
        }
        System.out.println(sep);
    }
}