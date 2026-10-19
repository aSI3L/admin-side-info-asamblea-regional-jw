import { edificiosService } from "@/services/index.generic.service"
import { Building } from "@/types/mapas.type"
import { create } from "zustand"

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
    }
}))