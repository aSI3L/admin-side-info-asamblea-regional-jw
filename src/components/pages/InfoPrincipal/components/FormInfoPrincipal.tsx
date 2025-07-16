"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4"
import { InfoPrincipalSchemaType } from "@/types/info-principal.type";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInfoPrincipal } from "@/hooks/useInfoPrincipal";
import { ImageIcon, Upload, X } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES } from "@/consts/imageFile.consts";
import { useFormImageUpload } from "@/hooks/useFormImageUpload";
import Image from "next/image";
import { useEffect } from "react";
import { AdaptableLoadingSpinner } from "@/components/common/LoadingSpinner/AdaptableLoadingSpinner";

export const infoPrincipalFormSchema = z.object({
  mainTitle: z.string().min(1, "El título principal es obligatorio"),
  year: z.string().regex(/^[0-9]*$/, "El año debe ser un número entero").min(4, "El año debe ser un número valido").max(4),
  color: z.object({
    primary: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Formato hexadecimal no válido"),
    secondary: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Formato hexadecimal no válido"),
    accent: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Formato hexadecimal no válido"),
  }),
  imageUrl: z.instanceof(File).or(z.url()).optional()
});

export function FormInfoPrincipal() {
  const { infoPrincipal, createInfoPrincipal, loadingInfoPrincipal } = useInfoPrincipal()

  const form = useForm<InfoPrincipalSchemaType>({
    resolver: zodResolver(infoPrincipalFormSchema),
    defaultValues: {
      mainTitle: infoPrincipal.mainTitle,
      year: infoPrincipal.year === 0 ? "" : infoPrincipal.year.toString(),
      color: {
        primary: infoPrincipal.color.primary,
        secondary: infoPrincipal.color.secondary,
        accent: infoPrincipal.color.accent,
      },
      imageUrl: infoPrincipal.imageUrl || undefined
    }
  })

  const { 
    imagePreview,
    dragActive,
    handleDrag,
    handleDrop,
    removeImage,
    handleChangeImage,
    uploadToImgBB
  } = useFormImageUpload<InfoPrincipalSchemaType>(form.setValue, form.setError, form.clearErrors, 'imageUrl', infoPrincipal.imageUrl)

  const onSubmit = async (data: InfoPrincipalSchemaType) => {
    if (!data.imageUrl) { 
      form.setError('imageUrl', { type: "manual", message: "La imagen es obligatoria."})
      return
    }

    const responseUploadImage = await uploadToImgBB("banner")

    if (responseUploadImage) {
      const formattedData = {
        ...data,
        year: parseInt(data.year),
        imageUrl: responseUploadImage
      }
      await createInfoPrincipal(infoPrincipal.id as string, formattedData)
    }
  }

  useEffect(() => {
    if (infoPrincipal && infoPrincipal.mainTitle) {
      form.reset({
        mainTitle: infoPrincipal.mainTitle,
        year: infoPrincipal.year === 0 ? "" : infoPrincipal.year.toString(),
        color: {
          primary: infoPrincipal.color.primary,
          secondary: infoPrincipal.color.secondary,
          accent: infoPrincipal.color.accent,
        },
        imageUrl: infoPrincipal.imageUrl || undefined
      });
    }
  }, [infoPrincipal, form]);

  if (loadingInfoPrincipal) return <AdaptableLoadingSpinner />

  return (
    <Card className="max-w-2xl w-full px-0 py-6 md:py-4 overflow-hidden">
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
                  <FormLabel>Color Primario</FormLabel>
                  <FormControl>
                    <Input placeholder="#000000" {...field}/>
                  </FormControl>
                  { form.formState.errors.color?.primary ? <FormMessage>{form.formState.errors.color.primary.message}</FormMessage> : <FormDescription>Aplicado al fondo</FormDescription>}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color.secondary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Secundario</FormLabel>
                  <FormControl>
                    <Input placeholder="#FFFFFF" {...field}/>
                  </FormControl>
                  { form.formState.errors.color?.secondary ? <FormMessage>{form.formState.errors.color.secondary.message}</FormMessage> : <FormDescription>Aplicado a textos, sombras, etc.</FormDescription>}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color.accent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color de Acento</FormLabel>
                  <FormControl>
                    <Input placeholder="#FFF000" {...field}/>
                  </FormControl>
                  { form.formState.errors.color?.accent ? <FormMessage>{form.formState.errors.color.accent.message}</FormMessage> : <FormDescription>Aplicado a botones o elementos que resalten</FormDescription>}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Imagen Banner</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {
                        !imagePreview ? (
                          <Card className={`border-2 border-dashed transition-all duration-200 hover:border-primary/50 p-0 cursor-pointer ${
                          dragActive ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-600"
                          }`}>
                            <CardContent className="p-0">
                              <div
                                className="relative p-8 text-center min-h-[230px] md:min-h-[300px] flex items-center justify-center"
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById("image-upload")?.click()}
                              >
                                <input
                                  id="image-upload"
                                  type="file"
                                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleChangeImage(file)
                                  }}
                                />

                                <div className="flex flex-col items-center space-y-3 md:space-y-4">
                                  <div className="p-3 md:p-4 bg-primary/10 rounded-full">
                                    <Upload className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                                  </div>

                                  <div className="space-y-1 md:space-y-2">
                                    <p className="text-base md:text-lg font-medium text-gray-900 dark:text-gray-100">
                                      <span className="hidden md:inline">Arrastra tu imagen aquí</span>
                                      <span className="md:hidden">Selecciona tu imagen</span>
                                    </p>
                                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                      <span className="hidden md:inline">
                                        o{" "}
                                        <span className="text-primary font-medium hover:underline">
                                          haz clic para seleccionar
                                        </span>
                                      </span>
                                      <span className="md:hidden">
                                        <span className="text-primary font-medium">Toca para seleccionar</span>
                                      </span>
                                    </p>
                                  </div>

                                  <div className="text-xs text-gray-400 dark:text-gray-500 px-2 text-center">
                                    PNG, JPG, WEBP hasta 5MB
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                        <Card className="p-0 overflow-hidden cursor-pointer">
                          <CardContent className="p-0">
                            <div className="relative">
                              <Image
                                src={typeof imagePreview === "string" ? imagePreview : "/placeholder.svg"}
                                alt="Image Preview"
                                width={500}
                                height={500}
                                className="w-full h-48 md:h-64 object-cover"
                              />
                              <div className="hidden lg:flex absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 items-center justify-center">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={removeImage}
                                  className="gap-2 h-9 sm:h-10 text-sm cursor-pointer"
                                >
                                  <X className="h-4 w-4" />
                                  Eliminar
                                </Button>
                              </div>
                              {/* Botón visible en mobile */}
                              <div className="absolute top-2 right-2 md:hidden">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={removeImage}
                                  className="h-8 w-8 p-0 rounded-full"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                <ImageIcon className="h-4 w-4" />
                                <span>Imagen cargada correctamente</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        )
                      }
                    </div>
                  </FormControl>
                  { form.formState.errors.imageUrl && <FormMessage>{ form.formState.errors.imageUrl.message }</FormMessage> }
                  
                </FormItem>
              )}
            />            
            <Button className="cursor-pointer w-20" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <AdaptableLoadingSpinner/> : "Submit"}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}