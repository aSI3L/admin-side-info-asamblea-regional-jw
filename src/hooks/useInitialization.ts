import { useEffect, useState } from "react"
import { useAuth } from "./useAuth"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/config/firebase"

export const useInitialization = () => {
    const { verifyIsAuthorized, setAuthUser, logout } = useAuth()
    const [isInitializing, setIsInitializing] = useState(true)
    
    useEffect(() => {
        const unsuscribe = onAuthStateChanged(auth, async (user) => {
            if (user && user.email) {
                const result = await verifyIsAuthorized(user.email)
    
                if (result) { setAuthUser(result) }
                else { await logout(); setAuthUser(null); }
            }
    
            setIsInitializing(false)
        })
    
        return unsuscribe
    }, [logout, setAuthUser, verifyIsAuthorized])

    return {
        isInitializing
    }
}