import { auth, googleProvider } from "@/config/firebase";
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from "firebase/auth";
import { usuariosAutorizadosService } from "./index.generic.service";
import { UserType } from "@/types/user.type";
import { FirebaseError } from "firebase/app";

export type LoginWithEmailResult =
    | { status: "success"; user: UserType }
    | { status: "not-authorized" }
    | { status: "wrong-password" }
    | { status: "needs-password-creation"; email: string }
    | { status: "error"; message: string }

export const loginWithEmail = async (email: string, password: string): Promise<LoginWithEmailResult> => {
    const authorizedUser = await usuariosAutorizadosService.getByEmail(email);
    try {
        await signInWithEmailAndPassword(auth, email, password)
        const user = auth.currentUser

        if (!user || !user.email) {
            console.log(user);
            throw new Error
        }
        
        if (!authorizedUser) {
            await deleteUser(user)
            return { status: "not-authorized" };
        }

        if (!user.displayName || !user.photoURL) {
            await updateProfile(user, {
                displayName: authorizedUser.displayName,
                photoURL: authorizedUser.photoURL
            })
        } 
        
        if (user.photoURL !== authorizedUser.photoURL || user.displayName !== authorizedUser.displayName) {
            await updateProfile(user, {
                displayName: authorizedUser.displayName,
                photoURL: authorizedUser.photoURL
            })
        }

        return { status: "success", user: authorizedUser }
    } catch (error) {
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/invalid-credential' && authorizedUser) {
                return { status: "needs-password-creation", email }
            }

            if (error.code === 'auth/invalid-password' && authorizedUser) {
                return { status: "wrong-password" }
            }

            return { status: "not-authorized" }
        }

        return { status: "error", message: 'Ha ocurrido un error. Espere unos instantes antes de volver a intentarlo. Si el error persiste comuníquese con el Departamento de Informes.' }
    }
}

export const createWithEmail = async (email: string, password: string): Promise<LoginWithEmailResult> => {
    try {
        const authorizedUser = await usuariosAutorizadosService.getByEmail(email);
        await createUserWithEmailAndPassword(auth, email, password)
        const user = auth.currentUser

        if (!user || !user.email) throw new Error("No se pudo obtener el usuario autenticado")
        
        if (!authorizedUser) {
            await deleteUser(user)
            return { status: "not-authorized" };
        } 
        return { status: "success", user: authorizedUser }
    } catch (error) {
        console.log(error);
        return { status: "error", message: 'Ha ocurrido un error. Espere unos instantes antes de volver a intentarlo. Si el error persiste comuníquese con el Departamento de Informes.' }
    }
}

export const loginWithGoogle = async (): Promise<LoginWithEmailResult> => {
    try {
        await signInWithPopup(auth, googleProvider)
        const user = auth.currentUser

        if (!user || !user.email) throw new Error("No se pudo obtener el usuario autenticado")
                    
        const authorizedUser = await usuariosAutorizadosService.getByEmail(user.email)
        
        if (!authorizedUser) {
            await deleteUser(user)
            return { status: "not-authorized" };
        }
                    
        if (!authorizedUser.displayName || !authorizedUser.photoURL) {
            const updatedUser: UserType = {
                ...authorizedUser,
                displayName: user.displayName || "",
                photoURL: user.photoURL || ""
            };
            await usuariosAutorizadosService.update(authorizedUser.id as string, updatedUser, true);
            return { status: "success", user: updatedUser }
        }

        return { status: "success", user: authorizedUser }
    } catch (error) {
        console.error(error);
        return { status: "error", message: 'Ha ocurrido un error. Espere unos instantes antes de volver a intentarlo. Si el error persiste comuníquese con el Departamento de Informes.' }
    }
}

export const logout = async () => {
    try {
        await signOut(auth)
    } catch (error) {
        console.log(error)
    }
}

export const verifyIsAuthorized = async (email: string): Promise<UserType | null> => {
    const verifiedUser = await usuariosAutorizadosService.getByEmail(email)

    return verifiedUser
}