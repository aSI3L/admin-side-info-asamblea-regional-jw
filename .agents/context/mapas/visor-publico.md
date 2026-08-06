# Visor de Mapas Público (Mobile-First)

**Ruta:** `/mapas/VisorMapa`  
**Uso:** Dispositivos móviles. Los usuarios buscan y siguen rutas dentro del edificio.  
**NO se usa en escritorio.**

---

## Archivos Clave

| Archivo | Rol |
|---|---|
| [`app/mapas/VisorMapa/page.tsx`](../../../app/mapas/VisorMapa/page.tsx) | Página principal del visor. Maneja toda la lógica de UI del móvil. |
| [`src/components/pages/VisorMapa/MapVisor.tsx`](../../../src/components/pages/VisorMapa/MapVisor.tsx) | Componente del mapa SVG interactivo. Contiene Dijkstra, animación de ruta, zoom/pan táctil. |

---

## Flujo del Usuario

1. **Pantalla de selección de edificio:** Lista de edificios cargada desde Firestore. El usuario toca uno.
2. **Pantalla del visor:** Mapa a pantalla completa con panel flotante superior y cajón inferior.
3. **Selección de ruta:** El usuario toca los campos de "Origen" y "Destino" → se abre un overlay de búsqueda a pantalla completa con filtro de texto en tiempo real.
4. **Visualización de ruta:** Al seleccionar ambos puntos, se calcula la ruta (Dijkstra) y se muestra animada en el mapa SVG.
5. **Instrucciones:** En el cajón inferior (*Bottom Sheet*) aparece la lista de pasos de la ruta.

---

## Componente `<MapVisor>`

### Props

```ts
interface MapVisorProps {
  edificioId: string;
  nivel: string;      // nivel activo (propagado hacia arriba)
  capa: string;       // siempre "Capa 1" en el visor público
  from: string;       // ID del nodo de origen
  to: string;         // ID del nodo de destino
  onInstructionsChange?: (instructions: string[]) => void; // callback para instrucciones
  onActiveNivelChange?: (nivel: string) => void;           // callback para nivel activo
}
```

### Estados Internos

```ts
allLevels: string[]      // Lista de todos los niveles del edificio
levelData: Record<string, { nodes, connections, pois }>  // Datos del grafo por nivel
planos: Record<string, string>   // URLs de las imágenes de plano por nivel
path: string[]           // Ruta calculada por Dijkstra (IDs de nodos en orden)
animPos: number          // Posición 0–1 de la flecha animada a lo largo de la ruta
zoom: number             // Zoom actual (inicializado desde baseZoom)
baseZoom: number         // Zoom calculado automáticamente para ajustar el mapa al contenedor
pan: { x, y }            // Desplazamiento del mapa
activeNivel: string      // Nivel visible actualmente en el mapa
```

### Funcionalidades

- **Zoom automático inicial:** Al montar el componente, se lee el tamaño real del `containerRef` y se calcula `baseZoom = Math.min(width, height) / 800`. El mapa siempre empieza encajado en la pantalla.
- **Zoom táctil (Pinch-to-zoom):** `onTouchStart` captura la distancia entre dos dedos y `onTouchMove` actualiza el zoom en proporción.
- **Arrastre (Pan):** `onTouchStart` con un dedo inicia el drag; `onTouchMove` actualiza `pan.x` y `pan.y`.
- **Botones flotantes:** ZoomIn (+25%), ZoomOut (-10%), Maximize (resetea a `baseZoom`).
- **Selector de pisos flotante:** Columna de botones en el margen derecho para cambiar `activeNivel` manualmente.
- **Cambio de piso automático:** Durante la animación de la flecha, el loop de `requestAnimationFrame` detecta en qué nivel se encuentra el nodo actual y cambia `activeNivel` si es diferente al actual.
- **Generación de instrucciones:** Al calcular la ruta, se genera un array de strings descriptivos (`"Partida desde: X"`, `"Sube/baja al Nivel Y"`, `"Pasa por: Z"`, `"Llegada a: W"`) y se propaga al padre mediante `onInstructionsChange`.

---

## Componente `<page.tsx>` (VisorMapa)

### Estados

```ts
edificioId: string      // ID del edificio seleccionado
edificioNombre: string  // Nombre del edificio (para mostrar en UI)
pois: { node, name, nivel }[]  // Todos los POIs del edificio cargados al seleccionar edificio
from: string            // ID del nodo de origen seleccionado
to: string              // ID del nodo de destino seleccionado
showVisor: boolean      // true cuando from y to están seleccionados
instructions: string[]  // Pasos generados por MapVisor
activeNivel: string     // Nivel activo propagado desde MapVisor
isBottomSheetOpen: bool // Estado del cajón inferior
searchField: "from" | "to" | null  // Qué campo está siendo buscado
searchQuery: string     // Texto del filtro de búsqueda
```

### Secciones del Layout

```
┌───────────────────────────────┐  ← Pantalla completa (h-screen w-screen)
│  [Panel flotante superior]    │  ← Fijo, z-30, glassmorphism
│  - Nombre edificio / Cambiar  │
│  - Botón Origen               │
│  - Botón Destino              │
│  - [↕] Swap  [✗] Limpiar     │
├───────────────────────────────┤
│                               │
│    [MapVisor - Full Screen]   │  ← Flex-1, ocupa todo el espacio restante
│                               │
├───────────────────────────────┤
│  [Bottom Sheet deslizable]    │  ← Absolute bottom-0, z-30, max-h-[50vh]
│  - Handle + toggle            │
│  - Lista de instrucciones     │
└───────────────────────────────┘

[Overlay de búsqueda fullscreen] ← fixed inset-0, z-50 (cuando searchField != null)
  - Barra de búsqueda con filtro
  - Lista de POIs filtrados con íconos
```
