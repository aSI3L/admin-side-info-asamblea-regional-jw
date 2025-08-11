"use client";

import { AdaptableLoadingSpinner } from "@/components/common/LoadingSpinner/AdaptableLoadingSpinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Building } from "@/types/mapas.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod/v4";

const edificioFormSchema = z.object({
    nombre: z.string().min(3, "El nombre del edificio es obligatorio"),
    planos: z.array(z.object({
        url: z.string().url("Debe ser una URL válida")
    }))
})

type EdificioFormSchema = z.infer<typeof edificioFormSchema>

interface FormEdificioProps {
    edificio?: Building
    createEdificioAction: (data: Building) => Promise<Building | null>
    updateEdificioAction: (id: string, data: Building) => Promise<boolean>
    cnBtnTrigger?: string
} 

export function FormEdificio({ edificio, createEdificioAction, updateEdificioAction, cnBtnTrigger }: FormEdificioProps) {
    const [open, setOpen] = useState(false)
    
    const convertPlanosToArray = (planosObj: Record<string, string> | undefined): { url: string }[] => {
        if (!planosObj) return [{ url: "" }];
        return Object.values(planosObj).map(url => ({ url }));
    }

    const convertArrayToPlanosObject = (planosArray: { url: string }[]): Record<string, string> => {
        const planosObject: Record<string, string> = {};
        planosArray.forEach((plano, index) => {
            planosObject[index.toString()] = plano.url;
        });
        return planosObject;
    }

    const form = useForm<EdificioFormSchema>({
        resolver: zodResolver(edificioFormSchema),
        defaultValues: {
            nombre: edificio?.nombre || "",
            planos: convertPlanosToArray(edificio?.planos)
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'planos'
    })

    const addPlano = () => {
        append({ url: "" });
    }

    const removePlano = (index: number) => {
        if (fields.length > 1) {
            remove(index)
        }
    }

    const handleCreateOrUpdate = async (edf: Building): Promise<boolean | Building | null> => {
        if (edificio) {
            console.log("Actualizando edificio:", edf);
            const isUpdated = await updateEdificioAction(edificio?.id as string, edf)
            return isUpdated
        } else {
            const isCreated = await createEdificioAction(edf);
            return isCreated
        }
    }

    const onSubmit = async (data: EdificioFormSchema) => {
        const planosObj = convertArrayToPlanosObject(data.planos);
        const edificioData: Building = {
            nombre: data.nombre,
            planos: planosObj
        }

        const response = await handleCreateOrUpdate(edificioData)

        if (response) {
            setOpen(false)
        }
    }

    useEffect(() => {
        if (!open && !edificio) {
            form.reset({ nombre: "", planos: [{ url: "" }] })
        }
        form.reset({ nombre: edificio?.nombre || "", planos: convertPlanosToArray(edificio?.planos) });
    }, [edificio, form, open])
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className={`cursor-pointer ${cnBtnTrigger || ""}`}>{ !edificio ? "Agregar Edificio" : <Pencil /> }</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{edificio ? "Editar" : "Nuevo"} Edificio</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="name">Nombre del Edificio</FormLabel>
                                    <FormControl>
                                        <Input id="name" placeholder="Arena Aconcagua" {...field} />
                                    </FormControl>
                                    {form.formState.errors.nombre && <FormMessage>{form.formState.errors.nombre.message}</FormMessage>}
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-base font-medium">Planos</FormLabel>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={addPlano}
                                    className="flex items-center gap-2 bg-transparent cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar Plano
                                </Button>
                            </div>
                            <Separator />
                        </div>
                        {
                            fields.map((field, index) => (
                                <FormField
                                    key={field.id}
                                    control={form.control}
                                    name={`planos.${index}.url`}
                                    render={({ field: planoField }) => (
                                        <FormItem>
                                            <FormLabel htmlFor={`planos.${index}.url`}>Nivel {index}</FormLabel>
                                            <div className="flex gap-2 items-center justify-between">
                                                <FormControl>
                                                    <Input
                                                        id={`planos.${index}.url`}
                                                        placeholder="https://example.com/plano.jpg"
                                                        {...planoField}
                                                    />
                                                </FormControl>
                                                {
                                                    fields.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => removePlano(index)}
                                                            className="flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    )
                                                }
                                            </div>
                                            {form.formState.errors.planos?.[index]?.url && (
                                                <FormMessage>{form.formState.errors.planos[index].url.message}</FormMessage>
                                            )}
                                        </FormItem>
                                    )}
                                />
                            ))
                        }
                        <div className="flex gap-2 justify-end">
                            <DialogClose asChild><Button className="cursor-pointer" variant="destructive">Cancelar</Button></DialogClose>
                            <Button className="cursor-pointer w-20" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <AdaptableLoadingSpinner /> : "Enviar"}</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}