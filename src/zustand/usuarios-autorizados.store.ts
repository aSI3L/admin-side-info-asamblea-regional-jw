import { usuariosAutorizadosService } from "@/services/index.generic.service";
import { UserType } from "@/types/user.type";
import { create } from "zustand";

interface UsuariosAutorizadosStore {
    usuariosAutorizados: UserType[];
    loadingUsuarios: boolean;
    getUsuariosAutorizados: () => Promise<void>;
    createUsuarioAutorizado: (email: string, data: UserType) => Promise<void>;
    updateUsuarioAutorizado: (oldEmail: string, data: UserType) => Promise<void>;
    deleteUsuarioAutorizado: (email: string) => Promise<void>;
}

export const useUsuariosAutorizadosStore = create<UsuariosAutorizadosStore>((set) => ({
    usuariosAutorizados: [],
    loadingUsuarios: false,
    getUsuariosAutorizados: async () => {
        set({ loadingUsuarios: true });
        const usuariosResponse = await usuariosAutorizadosService.getAll()
        if (usuariosResponse) {
            set({ usuariosAutorizados: usuariosResponse, loadingUsuarios: false });
        } else {
            set({ loadingUsuarios: false });
        }
    },
    createUsuarioAutorizado: async (email, data) => {
        await usuariosAutorizadosService.update(email, data)
    },
    updateUsuarioAutorizado: async (oldEmail: string, data: UserType) => {
        if (oldEmail !== data.email) {
            await usuariosAutorizadosService.delete(oldEmail);
            await usuariosAutorizadosService.update(data.email, data);
        }
        else {
            await usuariosAutorizadosService.update(oldEmail, data);
        }
    },
    deleteUsuarioAutorizado: async (email: string) => {
        await usuariosAutorizadosService.delete(email)
    }
}))