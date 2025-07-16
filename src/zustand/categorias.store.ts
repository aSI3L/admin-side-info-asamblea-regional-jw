import { categoriasService } from "@/services/index.generic.service";
import { CategoriasType } from "@/types/categorias.type";
import { create } from "zustand";

interface CategoriasStore {
    categorias: CategoriasType[]
    loadingCategorias: boolean
    getCategorias: () => Promise<void>
    updateCategoria: (id: string, data: CategoriasType) => Promise<void>
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
        console.log(data);
        await categoriasService.update(id, data)
    }
}))