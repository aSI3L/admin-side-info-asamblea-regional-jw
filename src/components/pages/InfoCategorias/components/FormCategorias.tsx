"use client";

import { AdaptableLoadingSpinner } from "@/components/common/LoadingSpinner/AdaptableLoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ACCEPTED_IMAGE_TYPES } from "@/consts/imageFile.consts";
import { useFormImageUpload } from "@/hooks/useFormImageUpload";
import { CategoriasFormSchemaType, CategoriasType } from "@/types/categorias.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Pencil, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";

export const categoriasFormSchema = z.object({
    name: z.string().min(1, "El nombre de la categoría es obligatorio"),
    description: z.string().min(10, "La descripción es obligatoria"),
    imageUrl: z.instanceof(File).or(z.url()).optional()
})

interface FormCategoriasProps {
    categoria: CategoriasType;
    updateCategoriaAction: (id: string, data: CategoriasType) => Promise<boolean>
}

export function FormCategorias({ categoria, updateCategoriaAction }: FormCategoriasProps) {
    const [open, setOpen] = useState(false)
    const form = useForm<CategoriasFormSchemaType>({
        resolver: zodResolver(categoriasFormSchema),
        defaultValues: {
            name: categoria.name,
            description: categoria.description,
            imageUrl: categoria.imageUrl || undefined
        }
    })

    const { imagePreview, handleSetImagePreview, dragActive, handleDrag, handleDrop, removeImage, handleChangeImage, uploadToImgBB } = useFormImageUpload<CategoriasFormSchemaType>(form.setValue, form.setError, form.clearErrors, 'imageUrl', categoria.imageUrl)

    const onSubmit = async (data: CategoriasFormSchemaType) => {
        const responseUploadImage = await uploadToImgBB(`categoria-${data.name}`);
        if (responseUploadImage) {
            const formattedData: CategoriasType = {
                ...data,
                imageUrl: responseUploadImage
            }
            const isUpdated = await updateCategoriaAction(categoria.id as string, formattedData);
            if (isUpdated) { setOpen(false) }
        }
    }

    const handleCancel = () => {
        handleSetImagePreview()
    }

    useEffect(() => {
        if (!open && !categoria) {
            form.reset({ name: "", description: "", imageUrl: undefined });
            return;
        }

        form.reset({
            name: categoria.name,
            description: categoria.description,
            imageUrl: categoria.imageUrl || undefined
        });

    }, [open, categoria, form])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="secondary" 
                    className="cursor-pointer w-full md:w-fit bg-white hover:bg-secondary/80 text-primary border border-border shadow-sm"
                >
                    {/* <span className="hidden md:inline">Editar</span> */}
                    <Pencil className="h-4 w-4" />
                    <span className="">Editar</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Categoría</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="name">Nombre de la Categoría</FormLabel>
                                    <FormControl>
                                        <Input id="name" placeholder="Servicios, Mapas, etc..." {...field} />
                                    </FormControl>
                                    {form.formState.errors.name && <FormMessage>{form.formState.errors.name.message}</FormMessage>}
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="description">Descripción de la Categoría</FormLabel>
                                    <FormControl>
                                        <Textarea id="description" placeholder="Escribe una descripción..." className="resize-none" {...field} />
                                    </FormControl>
                                    {form.formState.errors.description && <FormMessage>{form.formState.errors.description.message}</FormMessage>}
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
                                            {!imagePreview ? (
                                                <Card className={`border-2 border-dashed transition-all duration-200 hover:border-primary/50 p-0 cursor-pointer ${dragActive ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-600"
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
                                                            <Input
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
                                                                width={300}
                                                                height={300}
                                                                className="w-full h-48 md:h-64 object-cover"
                                                            />
                                                            <div className="hidden lg:flex absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 items-center justify-center">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={removeImage}
                                                                    className="gap-2 h-9 sm:h-10 text-sm cursor-pointer text-white border-white hover:bg-red-800"
                                                                    style={{ backgroundColor: '#8e0000' }}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                    Eliminar
                                                                </Button>
                                                            </div>
                                                            {/* Botón visible en mobile */}
                                                            <div className="absolute top-2 right-2 md:hidden">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={removeImage}
                                                                    className="h-8 w-8 p-0 rounded-full cursor-pointer text-white border-white hover:bg-red-800"
                                                                    style={{ backgroundColor: '#8e0000' }}
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
                                    {form.formState.errors.imageUrl && <FormMessage>{form.formState.errors.imageUrl.message}</FormMessage>}
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-2 justify-end">
                            <DialogClose asChild>
                                <Button 
                                    className="cursor-pointer" 
                                    variant="outline"
                                    onClick={handleCancel}
                                >
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button 
                                className="cursor-pointer w-20 bg-white hover:bg-secondary/80 text-primary border border-border shadow-sm" 
                                type="submit" 
                                disabled={form.formState.isSubmitting}
                                variant="secondary"
                            >
                                {form.formState.isSubmitting ? <AdaptableLoadingSpinner /> : "Guardar"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}