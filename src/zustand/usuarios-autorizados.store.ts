import { usuariosAutorizadosService } from "@/services/index.generic.service";
import { UserType } from "@/types/user.type";
import { toast } from "sonner";
import { create } from "zustand";

interface UsuariosAutorizadosStore {
    usuariosAutorizados: UserType[];
    loadingUsuarios: boolean;
    getUsuariosAutorizados: () => Promise<void>;
    createUsuarioAutorizado: (data: UserType) => Promise<UserType | null>;
    updateUsuarioAutorizado: (userId: string, data: UserType) => Promise<boolean>;
    deleteUsuarioAutorizado: (userId: string) => Promise<boolean>;
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
    createUsuarioAutorizado: async (data) => {
        const isCreated = await usuariosAutorizadosService.create(data)
        if (isCreated) {
            set((state) => ({
                usuariosAutorizados: [...state.usuariosAutorizados, { ...data, id: isCreated.id }]
            }));
            toast.success("Usuario creado correctamente");
        } else {
            toast.error("Ha ocurrido un error al crear el usuario");
        }
        return isCreated
    },
    updateUsuarioAutorizado: async (userId, data) => {
        const isUpdated = await usuariosAutorizadosService.update(userId, data, true);
        if (isUpdated) {
            set((state) => ({
                usuariosAutorizados: state.usuariosAutorizados.map(user => user.id === userId ? { ...user, ...data } : user)
            }));
            toast.success("Usuario actualizado correctamente");
        } else {
            toast.error("Ha ocurrido un error al actualizar el usuario");
        }
        return isUpdated
    },
    deleteUsuarioAutorizado: async (userId) => {
        const deleted = await usuariosAutorizadosService.delete(userId)
        if (deleted) {
            set((state) => ({
                usuariosAutorizados: state.usuariosAutorizados.filter(user => user.id !== userId)
            }))
            toast.success("Usuario eliminado correctamente");
        } else {
            toast.error("Ha ocurrido un error al eliminar el usuario");
        }
        return deleted
    }
}))