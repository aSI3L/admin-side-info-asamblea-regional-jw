import { UserType } from "@/types/user.type"

export const usuarioAutorizadoAdapter = (usuarioAutorizado: any): UserType => ({
    id: usuarioAutorizado.id,
    displayName: usuarioAutorizado.displayName,
    photoURL: usuarioAutorizado.photoURL,
    email: usuarioAutorizado.email,
    provider: usuarioAutorizado.provider
})