"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategorias } from "@/hooks/useCategorias";
import { FormCategorias } from "./FormCategorias";
import { LoadingSpinner } from "@/components/common/LoadingSpinner/LoadingSpinner";

export function TableCategories() {
    const { categorias, loadingCategorias, updateCategoria } = useCategorias()

    if (loadingCategorias) {
        return <LoadingSpinner />
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-50">Título Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                { categorias.length > 0 ? categorias.map((cat) => (
                    <TableRow key={cat.id}>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>{cat.description}</TableCell>
                        <TableCell><FormCategorias categoria={cat} updateCategoriaAction={updateCategoria} /></TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">No hay categorías disponibles</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}