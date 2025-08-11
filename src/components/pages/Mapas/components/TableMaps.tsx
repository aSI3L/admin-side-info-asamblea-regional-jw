"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MapPinned, Trash2 } from "lucide-react";
import { useEdificios } from "@/hooks/useEdificios";
import { AdaptableLoadingSpinner } from "@/components/common/LoadingSpinner/AdaptableLoadingSpinner";
import { FormEdificio } from "./FormEdificio";

export function TableMaps() {
    const { edificios, loadingEdificios, createEdificio, updateEdificio, deleteEdificio } = useEdificios()

    if (loadingEdificios) {
        return <AdaptableLoadingSpinner />
    }

    return (
        <div className="w-full">
        <div className="flex items-center justify-between pb-4">
            <h2 className="text-2xl font-bold">Edificios</h2>
            <FormEdificio createEdificioAction={createEdificio} updateEdificioAction={updateEdificio} />
        </div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-50">Nombre Edificio</TableHead>
                    <TableHead>Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                { edificios.length > 0 ? edificios.map((e) => (
                    <TableRow key={e.id}>
                        <TableCell>{e.nombre}</TableCell>
                        <TableCell className="flex gap-2">
                            <FormEdificio edificio={e} createEdificioAction={createEdificio} updateEdificioAction={updateEdificio} />
                            <Button className="cursor-pointer" variant="outline">
                                <MapPinned />
                            </Button>
                            <Button 
                                className="cursor-pointer text-white border-white hover:bg-red-800" 
                                style={{ backgroundColor: '#8e0000' }}
                                onClick={() => deleteEdificio(e.id as string)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">No hay edificios disponibles</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
        </div>
    );
}