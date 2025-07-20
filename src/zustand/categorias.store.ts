import { categoriasService } from "@/services/index.generic.service";
import { CategoriasType } from "@/types/categorias.type";
import { toast } from "sonner";
import { create } from "zustand";

interface CategoriasStore {
    categorias: CategoriasType[]
    loadingCategorias: boolean
    getCategorias: () => Promise<void>
    updateCategoria: (id: string, data: CategoriasType) => Promise<boolean>
}

export const useCategoriasStore = create<CategoriasStore>((set) => ({
    categorias: [],
    loadingCategorias: false,
    getCategorias: async () => {
        set({ loadingCategorias: true });
        const categoriasResponse = await categoriasService.getAll();
        if (categoriasResponse) {
            set({ categorias: categoriasResponse, loadingCategorias: false });
        } else {
            set({ loadingCategorias: false });
        }
    },
    updateCategoria: async (id, data) => {
        const updated = await categoriasService.update(id, data)

        if(updated) {
            set((state) => ({
                categorias: state.categorias.map(cat => cat.id === id ? { ...cat, ...data } : cat)
            }))
            toast.success("Categoría actualizada correctamente")
        } else {
            toast.error("Ha ocurrido un error al actualizar la categoría")
        }

        return updated
    }
}))