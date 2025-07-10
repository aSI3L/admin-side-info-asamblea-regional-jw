import { loginFormSchema } from "@/components/pages/Login/components/LoginForm";
import { z } from "zod/v4";

export type LoginFormSchema = z.infer<typeof loginFormSchema>;
export type UserType = { id?: string, displayName?: string, photoURL?: string, provider: 'email' | 'google' } & Omit<LoginFormSchema, 'password' | 'confirmPassword'>