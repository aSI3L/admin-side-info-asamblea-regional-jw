"use client";

import { useUsuariosAutorizadosStore } from "@/zustand/usuarios-autorizados.store"
import { useEffect } from "react";

export const useUsuariosAutorizados = () => {
    const usuariosAutorizados = useUsuariosAutorizadosStore(state => state.usuariosAutorizados);
    const loadingUsuarios = useUsuariosAutorizadosStore(state => state.loadingUsuarios);
    const getUsuariosAutorizados = useUsuariosAutorizadosStore(state => state.getUsuariosAutorizados);
    const createUsuarioAutorizado = useUsuariosAutorizadosStore(state => state.createUsuarioAutorizado);
    const updateUsuarioAutorizado = useUsuariosAutorizadosStore(state => state.updateUsuarioAutorizado);
    const deleteUsuarioAutorizado = useUsuariosAutorizadosStore(state => state.deleteUsuarioAutorizado);

    useEffect(() => {
        void getUsuariosAutorizados();
    }, [getUsuariosAutorizados])

    return {
        usuariosAutorizados,
        loadingUsuarios,
        createUsuarioAutorizado,
        updateUsuarioAutorizado,
        deleteUsuarioAutorizado
    }
}