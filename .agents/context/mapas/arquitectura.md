# Arquitectura del Módulo de Mapas

## Tipos de Datos (`src/types/mapas.type.ts`)

```ts
interface Node {
  x: number;      // Coordenada X en el canvas (0–800)
  y: number;      // Coordenada Y en el canvas (0–800)
  node: string;   // ID único del nodo (ej: "node_<timestamp>_<random>")
}

interface PointOfInterest extends Node {
  name: string;   // Nombre visible del punto (ej: "Baño Norte", "Entrada Principal")
  level?: number;
}

interface Vector {
  origen: string;         // ID del nodo de origen
  destino: string;        // ID del nodo de destino
  distancia: number;      // Peso de la arista (por defecto: 1)
  tipo?: string;
  nivel_origen?: number;  // Nivel del nodo de origen (para conexiones entre pisos)
  nivel_destino?: number; // Nivel del nodo de destino (para conexiones entre pisos)
}

interface Building {
  id?: string;
  nombre: string;
  planos: Record<string, string>; // { [nivelId]: "url_de_la_imagen_del_plano" }
}
```

---

## Estructura de Datos en Firestore

```
firestore/
└── mapas/
    └── {edificioId}_{nivel}/       (ej: "abc123_0", "abc123_1")
        ├── capaActiva: "Capa 1"    (campo en el documento raíz)
        └── capas/
            └── {nombreCapa}/       (ej: "Capa 1")
                ├── nodes: Node[]
                ├── connections: Vector[]
                └── pois: PointOfInterest[]
```

- Los planos (imágenes) de cada nivel se guardan como URLs en el documento del `Building` en la colección `edificios`.
- El grafo de navegación (nodos, conexiones, POIs) se guarda en la subcolección `capas` de cada `{edificioId}_{nivel}`.

---

## Algoritmo de Rutas: Dijkstra

Implementado en [`MapVisor.tsx`](../../src/components/pages/VisorMapa/MapVisor.tsx).

- Se cargan **todos los nodos y conexiones de todos los niveles** de la "Capa 1".
- Se aplica el algoritmo de Dijkstra con peso `distancia` (por defecto `1` por arista).
- El resultado es una lista ordenada de IDs de nodo que representan el camino más corto.
- Las conexiones entre pisos (escaleras/ascensores) se representan como aristas normales `Vector` que conectan nodos de distintos niveles. El sistema detecta el cambio de nivel al identificar en qué nivel pertenece cada nodo de la ruta.

---

## Servicios (`src/services/`)

| Archivo | Propósito |
|---|---|
| `generic.service.ts` | Clase genérica CRUD para Firestore (`getAll`, `getById`, `create`, `update`, `delete`) |
| `map-graph.service.ts` | Funciones específicas para leer/escribir capas de mapas (`saveMapLayer`, `loadMapLayers`, `setActiveLayer`, `getActiveLayer`) |
| `index.generic.service.ts` | Exporta instancias del servicio genérico (ej: `edificiosService`) |

---

## Stores de Zustand (`src/zustand/`)

| Store | Propósito |
|---|---|
| `grafo-mapa.store.ts` | Estado del editor de mapas: nodos, conexiones, POIs, nivel activo, capa activa. Incluye acciones para añadir/conectar/borrar nodos y guardar capas. |
| `editar-mapa.store.ts` | Estado del edificio cargado en el editor: `edificio`, `level` (URL de la imagen del nivel), `layer` (nombre de la capa activa). |
