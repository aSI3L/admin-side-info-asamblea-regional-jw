// AUTHOR: Agustin Terrero

export interface Node {
  x: number;
  y: number;
  node: string;
}

export interface PointOfInterest extends Node {
  name: string;
  level?: number;
  nivel?: number;
  /** id del icono de la biblioteca (src/consts/iconos.consts.ts) */
  icon?: string;
  /** cómo se muestra el nombre junto al icono en el mapa (sin definir = a la derecha) */
  etiqueta?: Etiqueta;
  /** tamaño propio del icono, multiplica la escala general del edificio (sin definir = 1) */
  escala?: number;
}

export type PosicionEtiqueta = "derecha" | "izquierda" | "arriba" | "abajo" | "libre";

export interface Etiqueta {
  visible: boolean;
  posicion: PosicionEtiqueta;
  /** separación entre el icono y el nombre, en unidades del mapa (posiciones fijas) */
  distancia: number;
  /** centro del nombre relativo al punto, en unidades del mapa (posición libre) */
  dx?: number;
  dy?: number;
}

export interface Vector {
  origen: string;
  destino: string;
  distancia: number;
  tipo?: string;
  nivel_origen?: number;
  nivel_destino?: number;
}

export interface Building {
  id?: string;
  nombre: string;
  planos: Record<string, string>;
  /** ids de los iconos de la biblioteca habilitados para este edificio */
  iconos?: string[];
  /** multiplicador del tamaño de los iconos sobre el mapa (1 = tamaño base) */
  escalaIconos?: number;
}

export interface Level {
  id: string;
  nombre: string;
  numero: number;
}

export interface Layer {
  id: string;
  nombre: string;
}

export interface StairConnection {
  nivelOrigen: number;
  nivelDestino: number;
  escaleraOrigen: string;
  escaleraDestino: string;
} 