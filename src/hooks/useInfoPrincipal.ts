import { useInfoPrincipalStore } from "@/zustand/info-principal.store"
import { useEffect } from "react"

export const useInfoPrincipal = () => {
    const infoPrincipal = useInfoPrincipalStore(state => state.infoPrincipal)
    const getInfoPrincipal = useInfoPrincipalStore(state => state.getInfoPrincipal)
    const createInfoPrincipal = useInfoPrincipalStore(state => state.createInfoPrincipal)

    useEffect(() => {
        void getInfoPrincipal()
    }, [])

    return { infoPrincipal, createInfoPrincipal }
}