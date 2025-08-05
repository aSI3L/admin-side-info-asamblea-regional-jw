import { Building } from "@/types/mapas.type";

export const edificiosAdapter = (edificio: any): Building => ({
    id: edificio.id,
    nombre: edificio.nombre,
    planos: edificio.planos
})