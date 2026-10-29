import { db } from "@/config/firebase"
import { COLLECTIONS } from "@/consts/collections.consts"
import { rotarCroquis, type SentidoGiro } from "@/lib/croquis"
import { loadMapLayers } from "@/services/map-graph.service"
import { edificiosService } from "@/services/index.generic.service"
import { Building, Node } from "@/types/mapas.type"
import { conDistancias, useGrafoMapaStore } from "@/zustand/grafo-mapa.store"
import { doc, writeBatch } from "firebase/firestore"
import { create } from "zustand"

/** Lado del lienzo cuadrado donde viven planos y coordenadas */
const LIENZO = 800

/** Posición de un punto tras girar el plano un cuarto de vuelta sobre su centro */
const rotarPunto = <T extends Pick<Node, "x" | "y">>(p: T, sentido: SentidoGiro): T => sentido === 1
    ? { ...p, x: LIENZO - p.y, y: p.x }
    : { ...p, x: p.y, y: LIENZO - p.x }

interface EditarMapaStore {
    edificio: Building | null
    loadingEdificio: boolean
    getEdificioById: (edificioId: string) => Promise<void>
    level: string
    setLevel: (level: string) => void
    layer: string
    setLayer: (layer: string) => void
    setEscalaIconos: (escala: number) => void
    guardarEscalaIconos: () => Promise<boolean>
    /** Gira el plano del nivel abierto junto con los puntos de todas sus capas, y lo guarda */
    rotarPlano: (sentido: SentidoGiro) => Promise<void>
}

export const useEditarMapaStore = create<EditarMapaStore>((set, get) => ({
    edificio: null,
    loadingEdificio: false,
    getEdificioById: async (edificioId) => {
        set({ loadingEdificio: true })
        const responseEdificio = await edificiosService.getById(edificioId)
        set({ edificio: responseEdificio, loadingEdificio: false });
    },
    level: "",
    setLevel: (level) => set({ level }),
    layer: "",
    setLayer: (layer) => set({ layer }),
    // Cambia la escala en pantalla al instante; se persiste aparte con guardarEscalaIconos
    setEscalaIconos: (escala) => {
        const { edificio } = get()
        if (edificio) set({ edificio: { ...edificio, escalaIconos: escala } })
    },
    guardarEscalaIconos: async () => {
        const { edificio } = get()
        if (!edificio?.id) return false
        // merge: solo actualiza este campo del edificio
        return edificiosService.update(edificio.id, { escalaIconos: edificio.escalaIconos } as Building, true)
    },
    rotarPlano: async (sentido) => {
        const { edificio, level } = get()
        const plano = edificio?.planos?.[level]
        if (!edificio?.id || !plano) throw new Error("Elegí un nivel con plano")
        const nuevoPlano = await rotarCroquis(plano, sentido)

        // Capas del nivel: las guardadas, con los cambios en pantalla por encima (incluida la capa abierta)
        const grafo = useGrafoMapaStore.getState()
        const capas = {
            ...await loadMapLayers({ edificioId: edificio.id, nivel: level }),
            ...grafo.capas[level],
            ...(grafo.capaActiva ? { [grafo.capaActiva]: { nodes: grafo.nodes, connections: grafo.connections, pois: grafo.pois } } : {}),
        }
        // Los iconos y nombres se mueven con el plano pero no giran: sólo cambian las coordenadas
        const rotadas = Object.fromEntries(Object.entries(capas).map(([nombre, capa]) => {
            const nodes = capa.nodes.map(n => rotarPunto(n, sentido))
            return [nombre, {
                nodes,
                connections: conDistancias(nodes, capa.connections),
                pois: capa.pois.map(p => ({ ...rotarPunto(p, sentido), nivel: Number(level) })),
            }]
        }))

        // Plano y capas se guardan juntos: o cambia todo o nada
        const batch = writeBatch(db)
        Object.entries(rotadas).forEach(([nombre, capa]) => {
            // Firestore rechaza campos `undefined`
            batch.set(doc(db, "mapas", `${edificio.id}_${level}`, "capas", nombre), JSON.parse(JSON.stringify(capa)))
        })
        batch.set(doc(db, COLLECTIONS.EDIFICIOS, edificio.id), { planos: { [level]: nuevoPlano } }, { merge: true })
        await batch.commit()

        set({ edificio: { ...edificio, planos: { ...edificio.planos, [level]: nuevoPlano } } })
        useGrafoMapaStore.getState().clearSelection()
        useGrafoMapaStore.getState().setCapasFromFirestore(level, rotadas)
    }
}))
