import { createWithEmail, loginWithEmail, loginWithGoogle, logout, verifyIsAuthorized } from "@/services/authentication.service";
import { UserType } from "@/types/user.type";
import { create } from "zustand";

type LoginErrorType = 'not-authorized' | 'needs-password-creation' | 'wrong-password' | 'error'

interface AuthStore {
    authUser: UserType | null;
    isLoadingAuth: boolean;
    loginError: null | { type: LoginErrorType, title?: string, message?: string, email?: string };
    setAuthUser: (user: UserType | null) => void;
    setIsLoadingAuth: (loading: boolean) => void;
    setLoginError: (error: null | { type: LoginErrorType, title?: string, message?: string, email?: string }) => void;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    createWithEmail: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    verifyIsAuthorized: (email: string) => Promise<UserType | null>
}

export const useAuthStore = create<AuthStore>((set) => ({
    authUser: null,
    isLoadingAuth: false,
    loginError: null,
    setAuthUser: (user) => set({ authUser: user }),
    setIsLoadingAuth: (loading) => set({ isLoadingAuth: loading }),
    setLoginError: (error) => set({ loginError: error }),
    loginWithEmail: async (email, password) => {
        set({ isLoadingAuth: true });
        const result = await loginWithEmail(email, password)
        
        if (result.status === 'success') set({ authUser: result.user, loginError: null })
        if (result.status === 'not-authorized') set({ loginError: { type: result.status, title: "No autorizado", message: "Su usuario no figura como autorizado. Verifique que haya introducido los datos correctamente o comuníquese con el Departamento de Informes." } })
        if (result.status === 'needs-password-creation') set({ loginError: { type: result.status, title: "Contraseña requerida", message: "Su usuario está autorizado pero se requiere que cree una contraseña para poder continuar.", email: result.email } })
        if (result.status === 'wrong-password') set({ loginError: { type: result.status } })
        if (result.status === 'error') set({ loginError: { type: result.status, title: "Error", message: result.message }})

        set({ isLoadingAuth: false });
    },
    createWithEmail: async (email, password) => {
        set({ isLoadingAuth: true })
        const result = await createWithEmail(email, password)

        if (result.status === 'success') set({ authUser: result.user, loginError: null })
        if (result.status === 'not-authorized') set({ loginError: { type: result.status, title: "No autorizado", message: "Su usuario no figura como autorizado. Verifique que haya introducido los datos correctamente o comuníquese con el Departamento de Informes." } })
        if (result.status === 'error') set({ loginError: { type: result.status, title: "Error", message: result.message }})

        set({ isLoadingAuth: false })
    },
    loginWithGoogle: async () => {
        set({ isLoadingAuth: true });
        const result = await loginWithGoogle()

        if (result.status === 'success') set({ authUser: result.user, loginError: null })
        if (result.status === 'not-authorized') set({ loginError: { type: result.status, title: "No autorizado", message: "Su usuario no figura como autorizado. Verifique que haya introducido los datos correctamente o comuníquese con el Departamento de Informes." } })
        if (result.status === 'error') set({ loginError: { type: result.status, title: "Error", message: result.message }})

        set({ isLoadingAuth: false });
    },
    logout: async () => {
        set({ isLoadingAuth: true });
        try {
            await logout()
            set({ authUser: null });
        } catch (error) {
            console.error("Error during logout:", error);
        } finally {
            set({ isLoadingAuth: false });
        }
    },
    verifyIsAuthorized: async (email) => {
        const result = await verifyIsAuthorized(email)
        return result
    }
}))