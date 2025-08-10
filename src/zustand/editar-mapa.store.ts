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
}

export const useEditarMapaStore = create<EditarMapaStore>((set) => ({
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
    setLayer: (layer) => set({ layer })
}))