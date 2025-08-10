"use client"

import { Separator } from "@/components/ui/separator"
import { ActionButtons } from "./components/ActionButtons"
import { POI } from "./components/POI"
import { MapEditor } from "./components/MapEditor"
import { Instructions } from "./components/Instructions"
import { useEditMapEdificio } from "@/hooks/useEditMapEdificio"
import { AdaptableLoadingSpinner } from "@/components/common/LoadingSpinner/AdaptableLoadingSpinner"

export function EditarMapaPage({ idEdificio }: { idEdificio: string }) {
    const { edificio, loadingEdificio } = useEditMapEdificio(idEdificio);

    if (loadingEdificio) {
        return <AdaptableLoadingSpinner />
    }

    return (
        <div className="flex flex-col gap-4 items-center py-2 px-4">
            <h2 className="text-2xl font-bold">Editor de Mapas</h2>
            <Separator />
            { edificio ? (<><ActionButtons />
                <div className="w-full flex flex-col gap-4 md:flex-row md:gap-4">
                    <div className="w-full md:w-8/12">
                        <MapEditor />
                    </div>
                    <div className="w-full md:w-4/12">
                        <POI />
                    </div>
                </div>
                <Instructions /></>)
                : 
                (<div className="flex items-center justify-center h-full"><p className="text-lg">Edificio no encontrado</p></div>)
            }
        </div>
    )
}