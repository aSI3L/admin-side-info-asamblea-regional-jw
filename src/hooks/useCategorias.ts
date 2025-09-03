"use client";

import { useCategoriasStore } from "@/zustand/categorias.store";
import { useEffect } from "react";

export const useCategorias = () => {
    const categorias = useCategoriasStore(state => state.categorias);
    const loadingCategorias = useCategoriasStore(state => state.loadingCategorias);
    const getCategorias = useCategoriasStore(state => state.getCategorias);
    const updateCategoria = useCategoriasStore(state => state.updateCategoria);

    useEffect(() => {
        void getCategorias();
    }, [getCategorias]);

    return { categorias, updateCategoria, loadingCategorias };
}