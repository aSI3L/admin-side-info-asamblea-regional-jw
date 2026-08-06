# Contexto del Módulo de Mapas Interactivos

**Proyecto:** `admin-side-info-asamblea-regional-jw`  
**Propósito:** Sistema de gestión y visualización de mapas interactivos de edificios para asambleas regionales de Testigos de Jehová. Permite a los usuarios encontrar rutas entre puntos de interés (POIs) dentro de uno o varios pisos de un edificio, y a los administradores editar los grafos de navegación.

---

## Estructura del Módulo

El módulo de mapas está dividido en **dos grandes subsistemas**:

### 1. Visor Público (Mobile-first)
Ruta de acceso: `/mapas/VisorMapa`  
Usado exclusivamente en **dispositivos móviles** por los asistentes durante el evento.

### 2. Editor Administrativo (Desktop)
Ruta de acceso: `/mapas/editar-mapa/[id]`  
Usado por el equipo de administración para construir el grafo de navegación de cada edificio.
