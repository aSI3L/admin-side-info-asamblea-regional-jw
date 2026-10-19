// Ubicación del nombre de un punto de interés respecto de su icono.
// Todo en unidades del mapa (lienzo de 800x800): el nombre escala junto con el croquis y el icono.
// Se usa igual en el editor (canvas) y en el visor (SVG), para que se vea lo mismo en ambos.

import type { Etiqueta, PointOfInterest } from "@/types/mapas.type"

export const ETIQUETA_DEFECTO: Etiqueta = { visible: true, posicion: "derecha", distancia: 4 }
export const DISTANCIA_ETIQUETA = { min: 0, max: 60 }

export const etiquetaDe = (poi: PointOfInterest): Etiqueta => ({ ...ETIQUETA_DEFECTO, ...poi.etiqueta })

/** Tamaño del nombre: acompaña la escala de los iconos, dentro de un rango legible */
export const tamanoEtiqueta = (escalaIconos: number) => Math.min(20, Math.max(9, Math.round(12 * escalaIconos)))

export interface LayoutEtiqueta {
    x: number
    y: number
    /** alineación horizontal respecto de (x, y) */
    align: "start" | "middle" | "end"
    /** alineación vertical respecto de (x, y) */
    baseline: "middle" | "bottom" | "top"
}

/**
 * Punto de anclaje del nombre.
 * @param mitad mitad del tamaño del icono (o un radio chico si el punto no tiene icono)
 */
export function layoutEtiqueta(x: number, y: number, etiqueta: Etiqueta, mitad: number): LayoutEtiqueta {
    const d = etiqueta.distancia
    switch (etiqueta.posicion) {
        case "izquierda": return { x: x - mitad - d, y, align: "end", baseline: "middle" }
        case "arriba": return { x, y: y - mitad - d, align: "middle", baseline: "bottom" }
        case "abajo": return { x, y: y + mitad + d, align: "middle", baseline: "top" }
        case "libre": return { x: x + (etiqueta.dx ?? 0), y: y + (etiqueta.dy ?? 0), align: "middle", baseline: "middle" }
        default: return { x: x + mitad + d, y, align: "start", baseline: "middle" }
    }
}

// Los nombres pueden tener saltos de línea (cómo se ven sobre el mapa). En listas, títulos e
// indicaciones se muestran en una sola línea.
export const lineasNombre = (nombre: string) => nombre.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
export const nombreEnUnaLinea = (nombre: string) => lineasNombre(nombre).join(" ")
/** Nombre listo para guardar: sin espacios sobrantes ni líneas vacías */
export const limpiarNombre = (nombre: string) => lineasNombre(nombre).join("\n")

/** Interlineado del nombre, relativo al tamaño de letra */
export const INTERLINEADO = 1.15

/**
 * Posición de la primera línea respecto del anclaje, en alturas de línea: centrado se reparte
 * hacia arriba y abajo, "bottom" crece hacia arriba y "top" hacia abajo.
 */
export const desfaseLineas = (baseline: LayoutEtiqueta["baseline"], lineas: number) =>
    baseline === "middle" ? -(lineas - 1) / 2 : baseline === "bottom" ? -(lineas - 1) : 0

// Equivalencias para dibujar en canvas y en SVG
export const canvasAlign = { start: "left", middle: "center", end: "right" } as const
export const svgBaseline = { middle: "central", bottom: "text-after-edge", top: "text-before-edge" } as const
