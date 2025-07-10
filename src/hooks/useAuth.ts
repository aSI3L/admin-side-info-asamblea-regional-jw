import { useAuthStore } from "@/zustand/authentication.store"

export const useAuth = () => {
    const authUser = useAuthStore(state => state.authUser);
    const loadingAuth = useAuthStore(state => state.loadingAuth);
    const loginError = useAuthStore(state => state.loginError);
    const setAuthUser = useAuthStore(state => state.setAuthUser);
    const setLoadingAuth = useAuthStore(state => state.setLoadingAuth);
    const setLoginError = useAuthStore(state => state.setLoginError);
    const loginWithEmail = useAuthStore(state => state.loginWithEmail);
    const createWithEmail = useAuthStore(state => state.createWithEmail);
    const loginWithGoogle = useAuthStore(state => state.loginWithGoogle);
    const logout = useAuthStore(state => state.logout);

    return {
        authUser,
        loadingAuth,
        loginError,
        setAuthUser,
        setLoadingAuth,
        setLoginError,
        loginWithEmail,
        createWithEmail,
        loginWithGoogle,
        logout
    }
}