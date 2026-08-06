# Historial de Cambios - Módulo de Mapas

---

## Sesión: 2026-08-06 — Rediseño de UI/UX del Visor Público (Mobile-First)

### Problema Identificado
El visor de mapas original presentaba:
- Formularios con `<select>` nativos poco táctiles.
- Todos los niveles de la ruta se apilaban verticalmente (mala UX en móvil).
- Sin zoom ni arrastre táctil.
- Sin transición automática de niveles durante la animación.
- Zoom por defecto de `1` que en un contenedor `800x800` se veía exageradamente grande en pantallas móviles.

---

### Cambios Realizados

#### `app/mapas/VisorMapa/page.tsx` — Rediseño completo de la página

**Antes:** Formulario vertical con `<select>` para edificio, origen y destino, y el `<MapVisor>` debajo.

**Después:** Interfaz mobile-first a pantalla completa con:
- **Pantalla de selección de edificio:** Tarjeta centrada con lista táctil de edificios.
- **Panel flotante superior (glassmorphism):** Muestra el nombre del edificio y los controles de origen/destino como botones. Botón de intercambio (swap ↕) y botón de limpiar ruta.
- **Overlay de búsqueda fullscreen:** Al tocar el campo de origen o destino, se abre un overlay `fixed inset-0 z-50` con barra de búsqueda con filtro de texto en tiempo real y lista de POIs con íconos.
- **Bottom Sheet deslizable:** Panel inferior con indicaciones paso a paso generadas por el componente `MapVisor`. Se puede colapsar/expandir con un toque.
- **Callbacks nuevos:** Se pasaron `onInstructionsChange` y `onActiveNivelChange` a `MapVisor` para recibir las instrucciones y el nivel activo.

---

#### `src/components/pages/VisorMapa/MapVisor.tsx` — Refactorización del visor

**Props añadidas:**
```ts
onInstructionsChange?: (instructions: string[]) => void;
onActiveNivelChange?: (nivel: string) => void;
```

**Estados añadidos:**
- `baseZoom: number` — Zoom calculado automáticamente al montar.
- `zoom: number` — Zoom actual (inicia en `baseZoom`).
- `pan: { x, y }` — Posición de arrastre del mapa.
- `isDragging: boolean` — Si el usuario está arrastrando.
- `touchStartDist: number | null` — Distancia inicial entre dos dedos (pinch).
- `activeNivel: string` — Nivel actualmente visible (reemplaza el renderizado de todos los niveles).
- `containerRef: RefObject<HTMLDivElement>` — Ref del contenedor para medir dimensiones.

**Cambios de comportamiento:**
1. **Zoom automático inicial:** `useEffect` que lee `containerRef.current.getBoundingClientRect()` y calcula `Math.min(width, height) / 800`. Se recalcula en el evento `resize`.
2. **Un solo plano visible:** En lugar de mapear `nivelesRutaOrdenados`, se renderiza únicamente el nivel `activeNivel`.
3. **Cambio de piso automático:** El loop `requestAnimationFrame` detecta en qué nivel está el nodo activo de la animación y llama a `setActiveNivel(nivelK)` si cambió.
4. **Generación de instrucciones:** Después de calcular la ruta con Dijkstra, se genera un array de texto paso a paso y se propaga con `onInstructionsChange`.
5. **Zoom y Pan táctil:**
   - `onTouchStart`: 1 dedo → inicia drag; 2 dedos → guarda distancia inicial.
   - `onTouchMove`: 1 dedo → actualiza `pan`; 2 dedos → actualiza `zoom` en proporción.
   - `onTouchEnd`: Resetea flags de drag y touch.
   - `onWheel`: Zoom con rueda del ratón (para desktop).
6. **Controles flotantes:** Botones ZoomIn, ZoomOut, Maximize (reset a `baseZoom`).
7. **Selector de pisos flotante:** `allLevels.map(lvl => <button>)` en el margen derecho.
8. **Botón resetZoom:** Ahora restablece a `baseZoom` en lugar de `1`.

---

### Corrección de Bug Post-Implementación

**Bug:** Después del refactor, quedó un `}` extra al final del archivo `MapVisor.tsx`, correspondiente al bloque de la función de utilidad `getArrowPoints`. Esto causaba el error de compilación TypeScript:
```
TS1128: Declaration or statement expected.
```

**Solución:** Se eliminó el `}` sobrante en la línea 538.

---

### Archivos Modificados

| Archivo | Tipo de Cambio |
|---|---|
| `app/mapas/VisorMapa/page.tsx` | Reescritura completa |
| `src/components/pages/VisorMapa/MapVisor.tsx` | Refactorización mayor |
| `src/config/firebase.ts` | Restauración de la configuración (comentada accidentalmente por el usuario) |
| `.env.local` | Creado con variables de entorno de Firebase e imgBB (NO incluir en git) |
