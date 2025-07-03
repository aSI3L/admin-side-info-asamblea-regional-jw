import { loginFormSchema } from "@/components/pages/Login/components/LoginForm";
import { Overwrite } from "@/lib/utils";
import { z } from "zod/v4";

export type LoginFormSchema = z.infer<typeof loginFormSchema>;
export type UserType = { id?: string, displayName: string, photoURL?: string } & Overwrite<LoginFormSchema, { password?: string }>;