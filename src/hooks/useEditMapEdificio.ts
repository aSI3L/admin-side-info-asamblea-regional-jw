"use client"

import { useEditarMapaStore } from "@/zustand/editar-mapa.store";
import { useEffect } from "react";

export const useEditMapEdificio = (edificioId?: string) => {
    const edificio = useEditarMapaStore(state => state.edificio);
    const getEdificioById = useEditarMapaStore(state => state.getEdificioById);
    const loadingEdificio = useEditarMapaStore(state => state.loadingEdificio);
    const level = useEditarMapaStore(state => state.level);
    const setLevel = useEditarMapaStore(state => state.setLevel);

    useEffect(() => {
        const fetchEdificio = async (edificioId: string) => {
            await getEdificioById(edificioId);
        };

        if (edificioId !== undefined) {
            void fetchEdificio(edificioId);
        }
    }, [getEdificioById, edificioId])

    return {
        edificio,
        loadingEdificio,
        level,
        setLevel
    }
}