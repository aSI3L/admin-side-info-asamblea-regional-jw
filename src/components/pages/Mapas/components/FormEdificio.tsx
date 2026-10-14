"use client";

import { AdaptableLoadingSpinner } from "@/components/common/LoadingSpinner/AdaptableLoadingSpinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ICONOS, iconoUrl } from "@/consts/iconos.consts";
import { CROQUIS_ACCEPT, procesarCroquis } from "@/lib/croquis";
import { Building } from "@/types/mapas.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod/v4";

// Límite total de los planos embebidos en el documento del edificio (Firestore admite 1 MiB)
const MAX_PLANOS_BYTES = 900 * 1024

const esCroquisEmbebido = (url: string) => url.startsWith("data:image/")

const edificioFormSchema = z.object({
    nombre: z.string().min(3, "El nombre del edificio es obligatorio"),
    planos: z.array(z.object({
        url: z.string().refine(
            url => esCroquisEmbebido(url) || /^https?:\/\/\S+$/.test(url),
            "Subí un croquis o pegá una URL válida"
        )
    })),
    iconos: z.array(z.string())
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
    const [procesando, setProcesando] = useState<number | null>(null)
    const fileInputs = useRef<Record<number, HTMLInputElement | null>>({})

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

    // Edificios anteriores a la biblioteca de iconos no tienen selección: se habilitan todos
    const iconosIniciales = (edf?: Building) => edf?.iconos?.length ? edf.iconos : ICONOS.map(i => i.id)

    const form = useForm<EdificioFormSchema>({
        resolver: zodResolver(edificioFormSchema),
        defaultValues: {
            nombre: edificio?.nombre || "",
            planos: convertPlanosToArray(edificio?.planos),
            iconos: iconosIniciales(edificio)
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

    const handleCroquisFile = async (index: number, file: File | undefined) => {
        if (!file) return
        setProcesando(index)
        try {
            const dataUrl = await procesarCroquis(file)
            form.setValue(`planos.${index}.url`, dataUrl, { shouldValidate: true, shouldDirty: true })
        } catch (error) {
            form.setError(`planos.${index}.url`, { type: "manual", message: error instanceof Error ? error.message : "No se pudo procesar el croquis" })
        } finally {
            setProcesando(null)
            const input = fileInputs.current[index]
            if (input) input.value = ""
        }
    }


    // Crea una capa inicial "Capa 1" vacía para cada nivel/plano
    const createInitialLayerForEachLevel = async (edificioId: string, planoKeys: string[]) => {
        const { saveMapLayer, setActiveLayer } = await import("@/services/map-graph.service");
        for (const nivel of planoKeys) {
            // Crea la capa vacía
            await saveMapLayer({
                edificioId,
                nivel,
                capa: "Capa 1",
                nodes: [],
                connections: [],
                pois: []
            });
            // Marca como activa
            await setActiveLayer({ edificioId, nivel, capaActiva: "Capa 1" });
        }
    };

    const handleCreateOrUpdate = async (edf: Building): Promise<boolean | Building | null> => {
        if (edificio) {
            const isUpdated = await updateEdificioAction(edificio?.id as string, edf)
            // Los niveles agregados al editar también arrancan con su "Capa 1"
            const nivelesNuevos = Object.keys(edf.planos).filter(nivel => !(nivel in (edificio.planos || {})))
            if (isUpdated && nivelesNuevos.length) {
                await createInitialLayerForEachLevel(edificio.id as string, nivelesNuevos);
            }
            return isUpdated
        } else {
            const isCreated = await createEdificioAction(edf);
            // Si se creó correctamente, crear las capas iniciales
            if (isCreated && typeof isCreated === 'object' && isCreated.id) {
                await createInitialLayerForEachLevel(isCreated.id, Object.keys(isCreated.planos));
            }
            return isCreated
        }
    }


    // Convierte enlaces de Google Drive a directos
    const toDirectGoogleDriveUrl = (url: string) => {
        const match = url.match(/https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)\//);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
        return url;
    };

    const onSubmit = async (data: EdificioFormSchema) => {
        const pesoPlanos = data.planos.reduce((total, plano) => total + plano.url.length, 0)
        if (pesoPlanos > MAX_PLANOS_BYTES) {
            form.setError("root", { type: "manual", message: `Los croquis suman ${Math.round(pesoPlanos / 1024)} KB y el máximo por edificio es ${MAX_PLANOS_BYTES / 1024} KB. Simplificá alguno o usá URLs.` })
            return
        }
        // Mapear todos los planos y convertir si es Google Drive
        const planosConvertidos = data.planos.map(plano => ({
            url: toDirectGoogleDriveUrl(plano.url)
        }));
        const planosObj = convertArrayToPlanosObject(planosConvertidos);
        const edificioData: Building = {
            nombre: data.nombre,
            planos: planosObj,
            iconos: data.iconos,
            // Se ajusta desde el editor de mapas; el guardado reemplaza el documento, así que se conserva
            escalaIconos: edificio?.escalaIconos ?? 1
        };

        const response = await handleCreateOrUpdate(edificioData);

        if (response) {
            setOpen(false);
        }
    };

    useEffect(() => {
        form.reset({ nombre: edificio?.nombre || "", planos: convertPlanosToArray(edificio?.planos), iconos: iconosIniciales(edificio) });
    }, [edificio, form, open])

    const iconosSeleccionados = form.watch("iconos")
    const toggleIcono = (id: string) => {
        const actuales = form.getValues("iconos")
        form.setValue("iconos", actuales.includes(id) ? actuales.filter(i => i !== id) : [...actuales, id], { shouldDirty: true })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className={`bg-white hover:bg-secondary/80 text-primary cursor-pointer ${cnBtnTrigger || ""}`}>{ !edificio ? "Agregar Edificio" : <Pencil /> }</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
                                <FormLabel className="text-base font-medium">Croquis por nivel</FormLabel>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={addPlano}
                                    className="flex items-center gap-2 bg-white hover:bg-secondary/80 text-primary cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar Nivel
                                </Button>
                            </div>
                            <p className="text-xs opacity-80">Subí el croquis de cada nivel (SVG, PNG, JPG o WEBP) o pegá la URL de una imagen.</p>
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
                                                {planoField.value ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={planoField.value} alt={`Croquis nivel ${index}`} className="h-12 w-12 shrink-0 rounded border bg-white object-contain" />
                                                ) : (
                                                    <div className="h-12 w-12 shrink-0 rounded border border-dashed" />
                                                )}
                                                {esCroquisEmbebido(planoField.value) ? (
                                                    <div className="flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm">
                                                        <span className="flex-1">Croquis cargado ({Math.round(planoField.value.length / 1024)} KB)</span>
                                                        <button type="button" title="Quitar croquis" className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => form.setValue(`planos.${index}.url`, "", { shouldDirty: true })}>
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <FormControl>
                                                        <Input
                                                            id={`planos.${index}.url`}
                                                            placeholder="https://example.com/plano.jpg"
                                                            {...planoField}
                                                        />
                                                    </FormControl>
                                                )}
                                                <input
                                                    ref={el => { fileInputs.current[index] = el }}
                                                    type="file"
                                                    accept={CROQUIS_ACCEPT}
                                                    className="hidden"
                                                    onChange={e => handleCroquisFile(index, e.target.files?.[0])}
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    title="Subir croquis"
                                                    disabled={procesando !== null}
                                                    onClick={() => fileInputs.current[index]?.click()}
                                                    className="flex items-center gap-2 bg-white hover:bg-secondary/80 text-primary cursor-pointer"
                                                >
                                                    {procesando === index ? <AdaptableLoadingSpinner /> : <Upload className="h-4 w-4" />}
                                                    Subir
                                                </Button>
                                                {
                                                    fields.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => removePlano(index)}
                                                            className="flex items-center gap-2 cursor-pointer text-white border-white hover:bg-red-800"
                                                            style={{ backgroundColor: '#8e0000' }}
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
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-base font-medium">Iconos del edificio</FormLabel>
                                <div className="flex gap-2 text-xs">
                                    <button type="button" className="cursor-pointer underline" onClick={() => form.setValue("iconos", ICONOS.map(i => i.id), { shouldDirty: true })}>Todos</button>
                                    <button type="button" className="cursor-pointer underline" onClick={() => form.setValue("iconos", [], { shouldDirty: true })}>Ninguno</button>
                                </div>
                            </div>
                            <p className="text-xs opacity-80">Son los iconos que vas a poder colocar en el editor de mapas de este edificio.</p>
                            <Separator />
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                {ICONOS.map(icono => {
                                    const activo = iconosSeleccionados.includes(icono.id)
                                    return (
                                        <button
                                            key={icono.id}
                                            type="button"
                                            onClick={() => toggleIcono(icono.id)}
                                            aria-pressed={activo}
                                            className={`flex cursor-pointer items-center gap-2 rounded-md border p-1.5 text-left text-xs transition-opacity ${activo ? "border-foreground/60 bg-foreground/10" : "border-transparent opacity-40 hover:opacity-70"}`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={iconoUrl(icono.id)} alt="" className="h-7 w-7 shrink-0" />
                                            <span className="leading-tight">{icono.nombre}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        {form.formState.errors.root && <FormMessage>{form.formState.errors.root.message}</FormMessage>}
                        <div className="flex gap-2 justify-end">
                            <DialogClose asChild>
                                <Button
                                    className="cursor-pointer"
                                    variant="outline"
                                >
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button
                                className="cursor-pointer bg-white hover:bg-secondary/80 text-primary border border-border shadow-sm w-20"
                                type="submit"
                                disabled={form.formState.isSubmitting || procesando !== null}
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
