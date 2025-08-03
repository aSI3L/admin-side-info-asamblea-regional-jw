"use client";

import { LoadingSpinner } from "@/components/common/LoadingSpinner/LoadingSpinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsuariosAutorizados } from "@/hooks/useUsuariosAutorizados";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function TableUsers() {
    const { usuariosAutorizados, loadingUsuarios, createUsuarioAutorizado, updateUsuarioAutorizado, deleteUsuarioAutorizado } = useUsuariosAutorizados()

    if (loadingUsuarios) {
        return <LoadingSpinner />
    }

    return (
        <div className="w-full">
        <div className="flex items-center justify-between pb-4">
            <h2 className="text-2xl font-bold">Usuarios Autorizados</h2>
            <FormUsers createUsuarioAutorizadoAction={createUsuarioAutorizado} updateUsuarioAutorizadoAction={updateUsuarioAutorizado} isNewUser />
        </div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-50">Email</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                { usuariosAutorizados.length > 0 ? usuariosAutorizados.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.displayName}</TableCell>
                        <TableCell className="flex gap-2"><FormUsers usuarioAutorizado={user} createUsuarioAutorizadoAction={createUsuarioAutorizado} updateUsuarioAutorizadoAction={updateUsuarioAutorizado} isNewUser={false} /> <Button className="cursor-pointer" variant="destructive" onClick={() => deleteUsuarioAutorizado(user.email)}><Trash2/></Button></TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">No hay usuarios autorizados disponibles</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
        </div>
    );
}