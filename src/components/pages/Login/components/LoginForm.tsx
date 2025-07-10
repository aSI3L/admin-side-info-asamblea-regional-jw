"use client"

import { LoadingSpinner } from "@/components/common/LoadingSpinner/LoadingSpinner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { LoginFormSchema } from "@/types/user.type"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import { ErrorLoginAlert } from "./ErrorLoginAlert"

export const loginFormSchema = z.object({
    email: z.email("Dirección de correo electrónico inválida").min(11, "El correo electrónico es obligatorio"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().optional()
})

export function LoginForm() {
    const { loginWithGoogle, loginWithEmail, createWithEmail, loginError } = useAuth()

    const form = useForm<LoginFormSchema>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: ""
        }
    })

    const onSubmit = async (data: LoginFormSchema) => {
        if (!loginError) await loginWithEmail(data.email, data.password)
        if (loginError?.type === 'wrong-password') {
            form.setError("password", { type: "manual", message: "Contraseña Incorrecta"})
        }
        if (loginError?.type === 'needs-password-creation') {
            if (!data.confirmPassword || data.confirmPassword.trim() === '') {
                form.setError("confirmPassword", { 
                    type: "manual", 
                    message: "Debes confirmar tu contraseña" 
                })
                return
            }
            
            if (data.password !== data.confirmPassword) {
                form.setError("confirmPassword", { 
                    type: "manual", 
                    message: "Las contraseñas no coinciden" 
                })
                return
            }

            await createWithEmail(data.email, data.password)
        }
    }
  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
        <ErrorLoginAlert />
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bienvenido de nuevo</CardTitle>
          <CardDescription>
            Inicia sesión con tu cuenta de Google
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4">
                <div className="flex flex-col gap-4">
                    <Button className="w-full cursor-pointer" onClick={loginWithGoogle}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                        />
                    </svg>
                    Iniciar Sesión con Google
                    </Button>
                </div>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                    O continúa con
                    </span>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field}) => (
                                <FormItem>
                                    <FormLabel htmlFor="email">Email</FormLabel>
                                    <FormControl>
                                        <Input id="email" placeholder="ejemplo@gmail.com" {...field} disabled={loginError?.type === 'needs-password-creation'} />
                                    </FormControl>
                                    { form.formState.errors.email && <FormMessage>{form.formState.errors.email.message}</FormMessage>}
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field}) => (
                                <FormItem>
                                    <FormLabel htmlFor="password">Contraseña</FormLabel>
                                    <FormControl>
                                        <Input id="password" type="password" {...field}/>
                                    </FormControl>
                                    { form.formState.errors.password && <FormMessage>{form.formState.errors.password.message}</FormMessage>}
                                </FormItem>
                            )}
                        />
                        { loginError?.type === 'needs-password-creation' &&
                            <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field}) => (
                                <FormItem>
                                    <FormLabel htmlFor="confirmPassword">Confirmar Contraseña</FormLabel>
                                    <FormControl>
                                        <Input id="confirmPassword" type="password" {...field}/>
                                    </FormControl>
                                    { form.formState.errors.confirmPassword && <FormMessage>{form.formState.errors.confirmPassword.message}</FormMessage>}
                                </FormItem>
                            )}
                        />
                        }
                        <Button className="cursor-pointer w-full" type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? <LoadingSpinner/> : loginError?.type === 'needs-password-creation' ? 'Crear Contraseña' : "Iniciar Sesión"}
                        </Button>
                    </form>
                </Form>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
