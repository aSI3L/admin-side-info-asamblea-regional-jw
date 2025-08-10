import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditMapEdificio } from "@/hooks/useEditMapEdificio";
import { Ellipsis, Link, MapPinX, Plus, Save, Trash2 } from "lucide-react";

export function ActionButtons() {
    const { edificio, level, setLevel } = useEditMapEdificio()
    console.log(level);
    const convertPlanosToArray = (planosObj: Record<string, string> | undefined): { url: string }[] => {
        if (!planosObj) return [{ url: "" }];
        return Object.values(planosObj).map(url => ({ url }));
    }

    return (
        <div className="w-full">
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="flex-1 md:flex-none md:w-44">
                        <Select value={level} onValueChange={setLevel}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccione un nivel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Niveles</SelectLabel>
                                    {
                                        convertPlanosToArray(edificio?.planos).map((plano, index) => (
                                            <SelectItem key={plano.url} value={plano.url}>{`Nivel ${index}`}</SelectItem>
                                        ))
                                    }
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                        <div className="flex-1 md:w-45">
                            <Select>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccione una capa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Capas</SelectLabel>
                                        <SelectItem value="prueba1">Prueba 1</SelectItem>
                                        <SelectItem value="prueba2">Prueba 2</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="shrink-0" size="icon"><Ellipsis/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Acciones de capa</DropdownMenuLabel>
                                <DropdownMenuItem><Plus/>Nueva capa</DropdownMenuItem>
                                <DropdownMenuItem><MapPinX/>Limpiar capa</DropdownMenuItem>
                                <DropdownMenuItem><Trash2/>Eliminar Capa</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Button className="flex-1 md:flex-none"><Save/>Guardar</Button>
                    <Button className="flex-1 md:flex-none"><Link/>Conectar escaleras</Button>
                </div>
            </div>
        </div>
    )
}