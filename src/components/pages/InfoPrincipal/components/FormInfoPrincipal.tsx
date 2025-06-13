"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4"
import { InfoPrincipalType } from "@/types/info-principal.type";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const infoPrincipalFormSchema = z.object({
  mainTitle: z.string().min(1, "El título principal es obligatorio"),
  year: z.string().regex(/^[0-9]*$/).min(4, "El año debe ser un número valido").max(4),
  color: z.object({
    primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "El color primario debe tener un formato hexadecimal válido"),
    secondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "El color secundario debe tener un formato hexadecimal válido"),
    accent: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "El color de acento debe tener un formato hexadecimal válido"),
  })
});

export function FormInfoPrincipal() {
  const form = useForm<InfoPrincipalType>({
    resolver: zodResolver(infoPrincipalFormSchema),
    defaultValues: {
      mainTitle: "",
      year: "",
      color: {
        primary: "",
        secondary: "",
        accent: "",
      }
    }
  })

  const onSubmit = (data: InfoPrincipalType) => {
    console.log("Form submitted with data:", data);
  }
  return (
    <Card className="w-full max-w-2xl p-6">
      <CardHeader className="text-center">
        <CardTitle>Información Principal</CardTitle>
        <CardDescription>Ingrese los textos y colores que se mostrarán en la página principal</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="mainTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="mainTitle">Título Principal</FormLabel>
                  <FormControl>
                    <Input id="mainTitle" placeholder="Adoración Pura" {...field}/>
                  </FormControl>
                  { form.formState.errors.mainTitle && <FormMessage>{form.formState.errors.mainTitle.message}</FormMessage>}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año de la Asamblea</FormLabel>
                  <FormControl>
                    <Input placeholder="2025" {...field}/>
                  </FormControl>
                  { form.formState.errors.year && <FormMessage>{form.formState.errors.year.message}</FormMessage>}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color.primary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Primario (para el color de fondo)</FormLabel>
                  <FormControl>
                    <Input placeholder="#000000" {...field}/>
                  </FormControl>
                  { form.formState.errors.color?.primary && <FormMessage>{form.formState.errors.color.primary.message}</FormMessage>}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color.secondary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Secundario (para los textos)</FormLabel>
                  <FormControl>
                    <Input placeholder="#FFFFFF" {...field}/>
                  </FormControl>
                  { form.formState.errors.color?.secondary && <FormMessage>{form.formState.errors.color.secondary.message}</FormMessage>}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color.accent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color de Acento (oara botones de acción)</FormLabel>
                  <FormControl>
                    <Input placeholder="#FFF000" {...field}/>
                  </FormControl>
                  { form.formState.errors.color?.accent && <FormMessage>{form.formState.errors.color.accent.message}</FormMessage>}
                </FormItem>
              )}
            />
            <Button className="cursor-pointer" type="submit">Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}