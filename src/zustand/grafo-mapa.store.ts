
import { create } from "zustand";
import type { Node, Vector, PointOfInterest, Etiqueta } from "@/types/mapas.type";

// Costo de un tramo entre niveles (escalera/ascensor), en las mismas unidades que el lienzo (800x800)
export const COSTO_CAMBIO_NIVEL = 60;

const largoTramo = (nodes: Node[], origen: string, destino: string) => {
  const a = nodes.find(n => n.node === origen);
  const b = nodes.find(n => n.node === destino);
  // Si un extremo está en otro nivel, es un cambio de nivel
  if (!a || !b) return COSTO_CAMBIO_NIVEL;
  return Math.max(1, Math.round(Math.hypot(a.x - b.x, a.y - b.y)));
};

/** Recalcula el largo de todos los tramos a partir de la posición de los nodos. */
export const conDistancias = (nodes: Node[], connections: Vector[]): Vector[] =>
  connections.map(c => ({ ...c, distancia: largoTramo(nodes, c.origen, c.destino) }));

interface GrafoMapaStore {
  nodes: Node[];
  connections: Vector[];
  pois: PointOfInterest[];
  selectedNode: string | null;
  capas: Record<string, Record<string, { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }>>; // capas[nivel][capa]
  nivelActivo: string;
  capaActiva: string;
  addNode: (x: number, y: number) => void;
  addPoi: (x: number, y: number, icon: string, name: string) => string;
  updatePoi: (nodeId: string, data: { name: string; icon?: string; etiqueta?: Etiqueta; escala?: number }) => void;
  updateEtiqueta: (nodeId: string, etiqueta: Etiqueta) => void;
  /** punto cuyo diálogo de edición hay que abrir (lo pide la lista de puntos o la barra de selección) */
  poiEnEdicion: string | null;
  setPoiEnEdicion: (nodeId: string | null) => void;
  moveNode: (nodeId: string, x: number, y: number) => void;
  connectNodes: (nodeA: string, nodeB: string) => void;
  disconnectNodes: (nodeA: string, nodeB: string) => void;
  renameNode: (nodeId: string, name: string) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  clearSelection: () => void;
  setAll: (data: { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }) => void;
  setNivelActivo: (nivel: string) => void;
  setCapaActiva: (capa: string) => void;
  setCapasFromFirestore: (nivel: string, capas: Record<string, { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }>) => void;
  crearCapa: (nombre: string) => void;
  guardarCapa: () => void;
}



export const useGrafoMapaStore = create<GrafoMapaStore>((set, get) => ({
  nodes: [],
  connections: [],
  pois: [],
  selectedNode: null,
  capas: {}, // capas[nivel][capa]
  nivelActivo: "",
  capaActiva: "",
  addNode: (x: number, y: number) => {
    const nodeId = `node_${Date.now()}_${Math.random()}`;
    set(state => ({ nodes: [...state.nodes, { x, y, node: nodeId }] }));
  },
  addPoi: (x: number, y: number, icon: string, name: string) => {
    const nodeId = `node_${Date.now()}_${Math.random()}`;
    set(state => ({
      nodes: [...state.nodes, { x, y, node: nodeId }],
      pois: [...state.pois, { x, y, node: nodeId, name, icon }],
    }));
    return nodeId;
  },
  updatePoi: (nodeId: string, { name, icon, etiqueta, escala }) => {
    set(state => {
      if (state.pois.some(poi => poi.node === nodeId)) {
        return { pois: state.pois.map(poi => poi.node === nodeId ? { ...poi, name, icon, etiqueta: etiqueta ?? poi.etiqueta, escala } : poi) };
      }
      const node = state.nodes.find(n => n.node === nodeId);
      if (!node) return {};
      return { pois: [...state.pois, { ...node, name, icon, etiqueta, escala }] };
    });
  },
  updateEtiqueta: (nodeId: string, etiqueta: Etiqueta) => {
    set(state => ({ pois: state.pois.map(poi => poi.node === nodeId ? { ...poi, etiqueta } : poi) }));
  },
  poiEnEdicion: null,
  setPoiEnEdicion: (nodeId: string | null) => set({ poiEnEdicion: nodeId }),
  moveNode: (nodeId: string, x: number, y: number) => {
    set(state => {
      const nodes = state.nodes.map(n => n.node === nodeId ? { ...n, x, y } : n);
      return {
        nodes,
        // Los tramos que tocan el nodo cambian de largo
        connections: state.connections.map(c => c.origen === nodeId || c.destino === nodeId
          ? { ...c, distancia: largoTramo(nodes, c.origen, c.destino) }
          : c),
        // También actualizar coordenadas del POI si el nodo es un punto de interés
        pois: state.pois.map(p => p.node === nodeId ? { ...p, x, y } : p),
      };
    });
  },
  connectNodes: (nodeA: string, nodeB: string) => {
    if (nodeA === nodeB) return;
    set(state => {
      if (state.connections.some(v => (v.origen === nodeA && v.destino === nodeB) || (v.origen === nodeB && v.destino === nodeA))) return state;
      return { connections: [...state.connections, { origen: nodeA, destino: nodeB, distancia: largoTramo(state.nodes, nodeA, nodeB) }] };
    });
  },
  disconnectNodes: (nodeA: string, nodeB: string) => {
    set(state => ({ connections: state.connections.filter(v => !( (v.origen === nodeA && v.destino === nodeB) || (v.origen === nodeB && v.destino === nodeA) )) }));
  },
  renameNode: (nodeId: string, name: string) => {
    set(state => {
      const exists = state.pois.some(poi => poi.node === nodeId);
      if (exists) {
        return { pois: state.pois.map(poi => poi.node === nodeId ? { ...poi, name } : poi) };
      } else {
        const node = state.nodes.find(n => n.node === nodeId);
        if (!node) return {};
        return { pois: [...state.pois, { ...node, name }] };
      }
    });
  },
  deleteNode: (nodeId: string) => {
    set(state => ({
      nodes: state.nodes.filter(n => n.node !== nodeId),
      connections: state.connections.filter(v => v.origen !== nodeId && v.destino !== nodeId),
      pois: state.pois.filter(poi => poi.node !== nodeId),
      selectedNode: state.selectedNode === nodeId ? null : state.selectedNode,
    }));
  },
  setSelectedNode: (nodeId: string | null) => set({ selectedNode: nodeId }),
  clearSelection: () => set({ selectedNode: null }),
  setAll: (data: { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }) => set({ nodes: data.nodes, connections: data.connections, pois: data.pois }),
  setNivelActivo: (nivel: string) => {
    set({ nivelActivo: nivel, capaActiva: "" });
    // Limpiar nodos/conexiones/pois al cambiar de nivel
    set({ nodes: [], connections: [], pois: [] });
  },
  setCapaActiva: (capa: string) => {
    const { nivelActivo, capas } = get();
    // Guardar la capa actual antes de cambiar
    if (nivelActivo && get().capaActiva) {
      set(state => ({
        capas: {
          ...state.capas,
          [nivelActivo]: {
            ...(state.capas[nivelActivo] || {}),
            [state.capaActiva]: {
              nodes: state.nodes,
              connections: state.connections,
              pois: state.pois,
            },
          },
        },
      }));
    }
    // Cargar la nueva capa si existe, si no, inicializar vacía
    const nueva = (capas[nivelActivo] && capas[nivelActivo][capa]) || { nodes: [], connections: [], pois: [] };
    set({
      capaActiva: capa,
      nodes: nueva.nodes,
      connections: nueva.connections,
      pois: nueva.pois,
    });
  },
  setCapasFromFirestore: (nivel, capasNivel) => {
    set(state => {
      // Actualizar las capas
      const nuevasCapas = {
        ...state.capas,
        [nivel]: capasNivel,
      };
      // Verificar si la capa activa sigue existiendo
      const capaActivaActual = state.capaActiva;
      const existeCapaActiva = nuevasCapas[nivel] && nuevasCapas[nivel][capaActivaActual];
      let nuevaCapaActiva = capaActivaActual;
      if (!existeCapaActiva) {
        // Elegir la primera capa disponible o vacío
        const keys = Object.keys(nuevasCapas[nivel] || {});
        nuevaCapaActiva = keys.length > 0 ? keys[0] : "";
      }
      // Cargar datos de la nueva capa activa
      const datos = (nuevasCapas[nivel] && nuevasCapas[nivel][nuevaCapaActiva]) || { nodes: [], connections: [], pois: [] };
      return {
        capas: nuevasCapas,
        capaActiva: nuevaCapaActiva,
        nodes: datos.nodes,
        connections: datos.connections,
        pois: datos.pois,
      };
    });
  },
  crearCapa: (nombre: string) => {
    const { nivelActivo, capas } = get();
    set(state => ({
      capas: {
        ...state.capas,
        [nivelActivo]: {
          ...(capas[nivelActivo] || {}),
          [nombre]: { nodes: [], connections: [], pois: [] },
        },
      },
      capaActiva: nombre,
      nodes: [],
      connections: [],
      pois: [],
    }));
  },
  guardarCapa: () => {
    const { nivelActivo, capaActiva, nodes, connections, pois, capas } = get();
    set(state => ({
      capas: {
        ...capas,
        [nivelActivo]: {
          ...(capas[nivelActivo] || {}),
          [capaActiva]: {
            nodes,
            connections,
            pois,
          },
        },
      },
    }));
  },
}));
