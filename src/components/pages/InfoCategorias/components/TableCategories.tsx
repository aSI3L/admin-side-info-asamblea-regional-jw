"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategorias } from "@/hooks/useCategorias";
import { FormCategorias } from "./FormCategorias";
import { AdaptableLoadingSpinner } from "@/components/common/LoadingSpinner/AdaptableLoadingSpinner";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function TableCategories() {
    const { categorias, loadingCategorias, updateCategoria } = useCategorias()

    if (loadingCategorias) {
        return <AdaptableLoadingSpinner />
    }

    return (
        <>
        <div className="hidden md:block w-full">
            <Table className="w-full">
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
        </div>
        <div className="flex flex-col items-center gap-2 md:hidden w-full h-full">
        {
            categorias.length > 0 ? categorias.map((cat) => (
                <Card key={cat.id} className="w-full">
                    <CardHeader className="text-center">
                        <CardTitle>{cat.name}</CardTitle>
                        <CardDescription>{cat.description}</CardDescription>
                    </CardHeader>
                    <CardFooter><FormCategorias categoria={cat} updateCategoriaAction={updateCategoria} /></CardFooter>
                </Card>
            )) : (
                <div className="my-auto">No hay categorías disponibles</div>
            )
        }
        </div>
        </>
    );
}