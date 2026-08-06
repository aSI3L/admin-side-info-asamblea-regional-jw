# Editor de Mapas Administrativo (Desktop)

**Ruta:** `/mapas/editar-mapa/[id]`  
**Uso:** Escritorio. El equipo de administración construye y edita el grafo de navegación de cada edificio.

---

## Archivos Clave

| Archivo | Rol |
|---|---|
| [`app/(dashboard)/mapas/editar-mapa/[id]/page.tsx`](../../../app/(dashboard)/mapas/editar-mapa/%5Bid%5D/page.tsx) | Página del editor (recibe el ID del edificio de la URL) |
| [`src/components/pages/EditarMapa/EditarMapaPage.tsx`](../../../src/components/pages/EditarMapa/EditarMapaPage.tsx) | Componente raíz del editor. Compone `ActionButtons`, `MapEditor`, `POI`, `Instructions`. |
| [`src/components/pages/EditarMapa/components/MapEditor.tsx`](../../../src/components/pages/EditarMapa/components/MapEditor.tsx) | Canvas principal donde se dibujan y editan nodos, conexiones y POIs. |
| [`src/components/pages/EditarMapa/components/ActionButtons.tsx`](../../../src/components/pages/EditarMapa/components/ActionButtons.tsx) | Controles de guardado, selección de nivel y capa. |
| [`src/components/pages/EditarMapa/components/POI.tsx`](../../../src/components/pages/EditarMapa/components/POI.tsx) | Panel lateral para gestionar Puntos de Interés. |
| [`src/components/pages/EditarMapa/components/ConnectStairsModal.tsx`](../../../src/components/pages/EditarMapa/components/ConnectStairsModal.tsx) | Modal para conectar nodos de escaleras entre distintos niveles. |
| [`src/hooks/useEditMapEdificio.ts`](../../../src/hooks/useEditMapEdificio.ts) | Hook que combina `useEditarMapaStore` para exponer `edificio` y `level` de forma conveniente. |

---

## Stores Involucrados

### `useEditarMapaStore` (`src/zustand/editar-mapa.store.ts`)

```ts
edificio: Building | null          // Edificio actualmente en edición
loadingEdificio: boolean
getEdificioById(id): Promise<void> // Carga el edificio de Firestore
level: string                      // URL de la imagen del plano activo (valor del Record<nivelId, url>)
setLevel(url): void
layer: string                      // Nombre de la capa activa (ej: "Capa 1")
setLayer(name): void
```

### `useGrafoMapaStore` (`src/zustand/grafo-mapa.store.ts`)

```ts
nodes: Node[]
connections: Vector[]
pois: PointOfInterest[]
selectedNode: string | null
capas: Record<nivel, Record<nombreCapa, { nodes, connections, pois }>>
nivelActivo: string
capaActiva: string
// Acciones:
addNode(x, y): void
connectNodes(nodeA, nodeB): void
disconnectNodes(nodeA, nodeB): void
renameNode(nodeId, name): void
deleteNode(nodeId): void
setSelectedNode(id): void
setAll(data): void
setNivelActivo(nivel): void
setCapaActiva(capa): void
setCapasFromFirestore(nivel, capas): void
crearCapa(nombre): void
guardarCapa(): void
```

---

## Interacciones en el Canvas (`MapEditor.tsx`)

El canvas es un elemento `<canvas>` que dibuja el grafo mediante la Canvas 2D API. El tamaño lógico es `800x800` px (igual que el viewBox del SVG del visor).

| Interacción | Acción |
|---|---|
| Click simple en área vacía | Crea un nodo (`addNode`) |
| Click en nodo | Selecciona el nodo (`setSelectedNode`) |
| Click en nodo ya seleccionado + Click en otro nodo | Conecta los dos nodos (`connectNodes`) |
| `Ctrl + Shift + Click` en nodo | Borra el nodo (`deleteNode`) |
| Click derecho en conexión | Desconecta los dos nodos (`disconnectNodes`) |

### Representación Visual

- **Nodo normal:** Círculo blanco con borde azul.
- **Nodo seleccionado:** Círculo azul sólido.
- **Conexión local (mismo nivel):** Línea gris sólida.
- **Conexión entre niveles:** Línea naranja discontinua que apunta al borde superior del canvas con etiqueta del destino.
- **Nombre del POI:** Texto negro pequeño junto al nodo.

---

## Guardado en Firestore

El guardado se realiza a través de `saveMapLayer` del servicio `map-graph.service.ts`:

```
mapas/{edificioId}_{nivel}/capas/{nombreCapa}
  → { nodes: Node[], connections: Vector[], pois: PointOfInterest[] }
```

El campo `capaActiva` en el documento raíz `mapas/{edificioId}_{nivel}` indica qué capa se debe cargar por defecto.
