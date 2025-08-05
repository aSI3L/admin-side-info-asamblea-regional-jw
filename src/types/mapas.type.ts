// AUTHOR: Agustin Terrero

export interface Node {
  x: number;
  y: number;
  node: string;
}

export interface PointOfInterest extends Node {
  name: string;
  level?: number;
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