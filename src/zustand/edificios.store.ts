import { edificiosService } from "@/services/index.generic.service";
import { Building } from "@/types/mapas.type";
import { toast } from "sonner";
import { create } from "zustand";

interface EdificiosStore {
    edificios: Building[];
    loadingEdificios: boolean;
    getEdificios: () => Promise<void>;
    createEdificio: (data: Building) => Promise<Building | null>;
    updateEdificio: (edificioId: string, data: Building) => Promise<boolean>;
    deleteEdificio: (edificioId: string) => Promise<boolean>;
}

export const useEdificiosStore = create<EdificiosStore>((set) => ({
    edificios: [],
    loadingEdificios: false,
    getEdificios: async () => {
        set({ loadingEdificios: true });
        const edificiosResponse = await edificiosService.getAll()
        if (edificiosResponse) {
            set({ edificios: edificiosResponse });
        }
        set({ loadingEdificios: false });
    },
    createEdificio: async (data) => {
        const isCreated = await edificiosService.create(data)
        if (isCreated) {
            set((state) => ({
                edificios: [...state.edificios, { ...data, id: isCreated.id }]
            }));
            toast.success("Edificio creado correctamente");
        } else {
            toast.error("Ha ocurrido un error al crear el edificio");
        }
        return isCreated
    },
    updateEdificio: async (edificioId, data) => {
        const isUpdated = await edificiosService.update(edificioId, data, false);
        if (isUpdated) {
            set((state) => ({
                edificios: state.edificios.map(edificio => edificio.id === edificioId ? { ...edificio, ...data } : edificio)
            }));
            toast.success("Edificio actualizado correctamente");
        } else {
            toast.error("Ha ocurrido un error al actualizar el edificio");
        }
        return isUpdated
    },
    deleteEdificio: async (edificioId) => {
        const deleted = await edificiosService.delete(edificioId)
        if (deleted) {
            set((state) => ({
                edificios: state.edificios.filter(edificio => edificio.id !== edificioId)
            }))
            toast.success("Edificio eliminado correctamente");
        } else {
            toast.error("Ha ocurrido un error al eliminar el edificio");
        }
        return deleted
    }
}))