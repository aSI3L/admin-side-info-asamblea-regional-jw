"use client";

import { LoadingSpinner } from "@/components/common/LoadingSpinner/LoadingSpinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsuariosAutorizados } from "@/hooks/useUsuariosAutorizados";
import { FormUsers } from "./FormUsers";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import DeleteAlert from "@/components/common/DeleteAlert/DeleteAlert";

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
            <div className="hidden md:block w-full">
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
                                <TableCell className="flex gap-2">
                                    <FormUsers usuarioAutorizado={user} createUsuarioAutorizadoAction={createUsuarioAutorizado} updateUsuarioAutorizadoAction={updateUsuarioAutorizado} isNewUser={false} />
                                    <DeleteAlert deleteUsuarioAutorizado={deleteUsuarioAutorizado} userId={user.id as string} />
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">No hay usuarios autorizados disponibles</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-col items-center gap-2 md:hidden w-full h-full">
            {
                usuariosAutorizados.length > 0 ? usuariosAutorizados.map((u) => (
                    <Card key={u.id} className="w-full">
                        <CardHeader className="text-center">
                            <CardTitle>{u.displayName}</CardTitle>
                            <CardDescription>{u.email}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex gap-2">
                            <div className="basis-10/12"><FormUsers usuarioAutorizado={u} createUsuarioAutorizadoAction={createUsuarioAutorizado} updateUsuarioAutorizadoAction={updateUsuarioAutorizado} isNewUser={false} cnBtnTrigger="w-full" /></div>
                            <div className="basis-2/12"><DeleteAlert deleteUsuarioAutorizado={deleteUsuarioAutorizado} userId={u.id as string} cnBtnTrigger="w-full" /></div>
                        </CardFooter>
                    </Card>
                )) : (
                    <div className="my-auto">No hay usuarios autorizados disponibles</div>
                )
            }
            </div>
        </div>
    );
}