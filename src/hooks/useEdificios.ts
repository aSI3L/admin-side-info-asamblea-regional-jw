"use client";

import { useEdificiosStore } from "@/zustand/edificios.store";
import { useEffect } from "react";

export const useEdificios = () => {
    const edificios = useEdificiosStore(state => state.edificios);
    const loadingEdificios = useEdificiosStore(state => state.loadingEdificios);
    const getEdificios = useEdificiosStore(state => state.getEdificios);
    const createEdificio = useEdificiosStore(state => state.createEdificio);
    const updateEdificio = useEdificiosStore(state => state.updateEdificio);
    const deleteEdificio = useEdificiosStore(state => state.deleteEdificio);

    useEffect(() => {
        void getEdificios();
    }, [getEdificios])

    return {
        edificios,
        loadingEdificios,
        createEdificio,
        updateEdificio,
        deleteEdificio
    }
}