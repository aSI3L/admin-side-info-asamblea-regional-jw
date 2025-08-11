
import { create } from "zustand";
import type { Node, Vector, PointOfInterest } from "@/types/mapas.type";

interface GrafoMapaStore {
  nodes: Node[];
  connections: Vector[];
  pois: PointOfInterest[];
  selectedNode: string | null;
  capas: Record<string, { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }>;
  capaActiva: string;
  addNode: (x: number, y: number) => void;
  connectNodes: (nodeA: string, nodeB: string) => void;
  disconnectNodes: (nodeA: string, nodeB: string) => void;
  renameNode: (nodeId: string, name: string) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  clearSelection: () => void;
  setAll: (data: { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }) => void;
  setCapaActiva: (capa: string) => void;
  crearCapa: (nombre: string) => void;
  guardarCapa: () => void;
}


export const useGrafoMapaStore = create<GrafoMapaStore>((set, get) => ({
  nodes: [],
  connections: [],
  pois: [],
  selectedNode: null,
  capas: {},
  capaActiva: "",
  addNode: (x: number, y: number) => {
    const nodeId = `node_${Date.now()}_${Math.random()}`;
    set(state => ({ nodes: [...state.nodes, { x, y, node: nodeId }] }));
  },
  connectNodes: (nodeA: string, nodeB: string) => {
    if (nodeA === nodeB) return;
    set(state => {
      if (state.connections.some(v => (v.origen === nodeA && v.destino === nodeB) || (v.origen === nodeB && v.destino === nodeA))) return state;
      return { connections: [...state.connections, { origen: nodeA, destino: nodeB, distancia: 1 }] };
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
  setCapaActiva: (capa: string) => {
    const store = get();
    // Guardar la capa actual antes de cambiar
    if (store.capaActiva) {
      set(state => ({
        capas: {
          ...state.capas,
          [state.capaActiva]: {
            nodes: state.nodes,
            connections: state.connections,
            pois: state.pois,
          },
        },
      }));
    }
    // Cargar la nueva capa si existe, si no, inicializar vacía
    const nueva = get().capas[capa] || { nodes: [], connections: [], pois: [] };
    set({
      capaActiva: capa,
      nodes: nueva.nodes,
      connections: nueva.connections,
      pois: nueva.pois,
    });
  },
  crearCapa: (nombre: string) => {
    set(state => ({
      capas: {
        ...state.capas,
        [nombre]: { nodes: [], connections: [], pois: [] },
      },
      capaActiva: nombre,
      nodes: [],
      connections: [],
      pois: [],
    }));
  },
  guardarCapa: () => {
    set(state => ({
      capas: {
        ...state.capas,
        [state.capaActiva]: {
          nodes: state.nodes,
          connections: state.connections,
          pois: state.pois,
        },
      },
    }));
  },
}));
