import { CategoriasType } from "@/types/categorias.type";

export const categoriasAdapter = (categoria: any): CategoriasType => ({
    id: categoria.id,
    name: categoria.name,
    description: categoria.description,
    imageUrl: categoria.imageUrl
})