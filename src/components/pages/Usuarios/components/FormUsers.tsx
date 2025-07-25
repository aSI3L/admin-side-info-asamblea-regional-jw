import { LoadingSpinner } from "@/components/common/LoadingSpinner/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/config/firebase";
import { UserType } from "@/types/user.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";

const usersFormGoogleSchema = z.object({
    email: z.string().regex(/^[a-z0-9](\.?[a-z0-9]){2,}@gmail\.com$/i, "Ingrese un Gmail válido").min(1, "El email es requerido"),
})

const usersFormEmailSchema = z.object({
    email: z.email().min(1, "El email es requerido"),
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    photoURL: z.url().or(z.literal("")).optional()
})

type UsersFormGoogleSchema = z.infer<typeof usersFormGoogleSchema>
type UsersFormEmailSchema = z.infer<typeof usersFormEmailSchema>;

interface FormUsersProps {
    usuarioAutorizado?: UserType
    createUsuarioAutorizadoAction: (email: string, data: UserType) => Promise<void>
    updateUsuarioAutorizadoAction: (oldEmail: string, data: UserType) => Promise<void>
    isNewUser: boolean
}

export function FormUsers({ usuarioAutorizado, createUsuarioAutorizadoAction, updateUsuarioAutorizadoAction, isNewUser }: FormUsersProps) {
    const googleForm = useForm<UsersFormGoogleSchema>({
        resolver: zodResolver(usersFormGoogleSchema),
        defaultValues: {
            email: !usuarioAutorizado ? "" : usuarioAutorizado.provider === 'google' ? usuarioAutorizado.email : "" ,
        }
    })

    const emailForm = useForm<UsersFormEmailSchema>({
        resolver: zodResolver(usersFormEmailSchema),
        defaultValues: {
            email: !usuarioAutorizado ? "" : usuarioAutorizado.provider === 'email' ? usuarioAutorizado.email : "",
            firstName: usuarioAutorizado?.displayName?.split(" ")[0] || "",
            lastName: usuarioAutorizado?.displayName?.split(" ")[1] || "",
            photoURL: usuarioAutorizado?.photoURL || "",
        }
    })

    const handleCreateOrUpdate = async (updatedUser: UserType) => {
        if (usuarioAutorizado) {
            await updateUsuarioAutorizadoAction(usuarioAutorizado.email, updatedUser)
        } else {
            await createUsuarioAutorizadoAction(updatedUser.email, updatedUser);
        }
    }

    const onSubmitGoogle = async (data: UsersFormGoogleSchema) => {
        const updatedUser: UserType = {
            email: data.email,
            provider: "google",
        };
        await handleCreateOrUpdate(updatedUser)
    }

    const onSubmitEmail = async (data: UsersFormEmailSchema) => {
        console.log(auth.currentUser);
        const updatedUser: UserType = {
            email: data.email,
            displayName: `${data.firstName} ${data.lastName}`,
            provider: "email",
            photoURL: data.photoURL,
        };
        await handleCreateOrUpdate(updatedUser)
    }

    return (
        <Dialog>
            <DialogTrigger asChild><Button>{ isNewUser ? "Agregar Usuario Autorizado" : <Pencil /> }</Button></DialogTrigger>
            <DialogContent>
                <DialogTitle />
                <Tabs defaultValue={ usuarioAutorizado ? usuarioAutorizado.provider : 'google' } className="w-full">
                    <TabsList>
                        <TabsTrigger value="google">Con Google</TabsTrigger>
                        <TabsTrigger value="email">Con Email</TabsTrigger>
                    </TabsList>
                    <TabsContent value="google">
                        <DialogHeader className="py-5">
                            <DialogTitle>{ isNewUser ? "Agregar mail autorizado de Google" : "Editar mail autorizado de Google"}</DialogTitle>
                        </DialogHeader>
                        <Form {...googleForm}>
                            <form onSubmit={googleForm.handleSubmit(onSubmitGoogle)} className="space-y-5">
                                <FormField
                                    control={googleForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="gmail">Gmail</FormLabel>
                                            <FormControl>
                                                <Input id="gmail" placeholder="ejemplo@gmail.com" {...field} />
                                            </FormControl>
                                            {googleForm.formState.errors.email && <FormMessage>{googleForm.formState.errors.email.message}</FormMessage>}
                                        </FormItem>
                                    )}
                                />
                                <Button className="cursor-pointer" type="submit" disabled={googleForm.formState.isSubmitting}>{googleForm.formState.isSubmitting ? <LoadingSpinner /> : "Submit"}</Button>
                            </form>
                        </Form>
                    </TabsContent>
                    <TabsContent value="email">
                        <DialogHeader className="py-5">
                            <DialogTitle>{ isNewUser ? "Agregar usuario autorizado" : "Editar usuario autorizado"}</DialogTitle>
                        </DialogHeader>
                        <Form {...emailForm}>
                            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-5">
                                <FormField
                                    control={emailForm.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="firstName">Nombre</FormLabel>
                                            <FormControl>
                                                <Input id="firstName" {...field} />
                                            </FormControl>
                                            {emailForm.formState.errors.firstName && <FormMessage>{emailForm.formState.errors.firstName.message}</FormMessage>}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={emailForm.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="lastName">Apellido</FormLabel>
                                            <FormControl>
                                                <Input id="lastName" {...field} />
                                            </FormControl>
                                            {emailForm.formState.errors.lastName && <FormMessage>{emailForm.formState.errors.lastName.message}</FormMessage>}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={emailForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="email">Email</FormLabel>
                                            <FormControl>
                                                <Input id="email" placeholder="ejemplo@hotmail.com" {...field} />
                                            </FormControl>
                                            {emailForm.formState.errors.email && <FormMessage>{emailForm.formState.errors.email.message}</FormMessage>}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={emailForm.control}
                                    name="photoURL"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="photoURL">Imagen de Perfil URL</FormLabel>
                                            <FormControl>
                                                <Input id="photoURL" {...field} />
                                            </FormControl>
                                            {emailForm.formState.errors.photoURL && <FormMessage>{emailForm.formState.errors.photoURL.message}</FormMessage>}
                                        </FormItem>
                                    )}
                                />
                                <Button className="cursor-pointer" type="submit" disabled={emailForm.formState.isSubmitting}>{emailForm.formState.isSubmitting ? <LoadingSpinner /> : "Submit"}</Button>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}