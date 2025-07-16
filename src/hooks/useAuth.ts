import { useAuthStore } from "@/zustand/authentication.store"

export const useAuth = () => {
    const authUser = useAuthStore(state => state.authUser);
    const isLoadingAuth = useAuthStore(state => state.isLoadingAuth);
    const loginError = useAuthStore(state => state.loginError);
    const setAuthUser = useAuthStore(state => state.setAuthUser);
    const setIsLoadingAuth = useAuthStore(state => state.setIsLoadingAuth);
    const setLoginError = useAuthStore(state => state.setLoginError);
    const loginWithEmail = useAuthStore(state => state.loginWithEmail);
    const createWithEmail = useAuthStore(state => state.createWithEmail);
    const loginWithGoogle = useAuthStore(state => state.loginWithGoogle);
    const logout = useAuthStore(state => state.logout);
    const verifyIsAuthorized = useAuthStore(state => state.verifyIsAuthorized)

    return {
        authUser,
        isLoadingAuth,
        loginError,
        setAuthUser,
        setIsLoadingAuth,
        setLoginError,
        loginWithEmail,
        createWithEmail,
        loginWithGoogle,
        logout,
        verifyIsAuthorized
    }
}