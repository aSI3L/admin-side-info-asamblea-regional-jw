import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditMapEdificio } from "@/hooks/useEditMapEdificio";
import { Ellipsis, Link, MapPinX, Plus, Save, Trash2 } from "lucide-react";
import { useGrafoMapaStore } from "@/zustand/grafo-mapa.store";
import { saveMapGraph } from "@/services/map-graph.service";
import { useState } from "react";
import { toast } from "sonner";
import { ConnectStairsModal } from "./ConnectStairsModal";

export function ActionButtons() {
    const { edificio, level, setLevel } = useEditMapEdificio()
    console.log(level);
    const convertPlanosToArray = (planosObj: Record<string, string> | undefined): { url: string }[] => {
        if (!planosObj) return [{ url: "" }];
        return Object.values(planosObj).map(url => ({ url }));
    }

    const nodes = useGrafoMapaStore(state => state.nodes);
    const connections = useGrafoMapaStore(state => state.connections);
    const pois = useGrafoMapaStore(state => state.pois);
    const setAll = useGrafoMapaStore(state => state.setAll);
    const connectNodes = useGrafoMapaStore(state => state.connectNodes);
    const capas = useGrafoMapaStore(state => state.capas);
    const capaActiva = useGrafoMapaStore(state => state.capaActiva);
    const setCapaActiva = useGrafoMapaStore(state => state.setCapaActiva);
    const crearCapa = useGrafoMapaStore(state => state.crearCapa);

    // Modal conectar escaleras
    const [openStairs, setOpenStairs] = useState(false);

    const handleConnectStairs = (ids: string[]) => {
        // Conectar todos los seleccionados entre sí (combinación de pares)
        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                connectNodes(ids[i], ids[j]);
            }
        }
    };
    // Acciones de capa
    const handleNuevaCapa = () => {
        // Generar nombre único
        let idx = 1;
        let nombre = `Capa ${idx}`;
        while (capas[nombre]) {
            idx++;
            nombre = `Capa ${idx}`;
        }
        crearCapa(nombre);
        setCapaActiva(nombre);
    };

    const handleLimpiarCapa = () => {
        setAll({ nodes: [], connections: [], pois: [] });
    };

    const handleEliminarCapa = () => {
        if (!capaActiva) return;
        const nuevasCapas = { ...capas };
        delete nuevasCapas[capaActiva];
        // Elegir otra capa si existe
        const keys = Object.keys(nuevasCapas);
        if (keys.length > 0) {
            setCapaActiva(keys[0]);
        } else {
            setAll({ nodes: [], connections: [], pois: [] });
            setCapaActiva("");
        }
        // Actualizar el store manualmente
        // (No hay método en el store, así que forzamos con setAll y setCapaActiva)
        // Si quieres persistir capas, deberías agregar un método en el store
    };

    // Conectar escaleras (ejemplo: solo muestra alerta, implementar lógica real según tu modelo)


    // Obtener el índice del nivel seleccionado
    const getLevelIndex = () => {
        if (!edificio?.planos || !level) return null;
        const entries = Object.entries(edificio.planos);
        const found = entries.find(([idx, url]) => url === level);
        return found ? found[0] : null;
    };

    const handleSave = async () => {
        if (!edificio?.id || !level) {
            alert("Seleccione un edificio y un nivel");
            return;
        }
        const nivelId = getLevelIndex();
        if (!nivelId) {
            alert("No se pudo determinar el índice del nivel seleccionado");
            return;
        }
        await saveMapGraph({
            edificioId: edificio.id,
            nivel: nivelId,
            nodes,
            connections,
            pois,
        });
    toast.success("Mapa guardado correctamente");
    };

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
                            <Select value={capaActiva} onValueChange={setCapaActiva}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccione una capa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Capas</SelectLabel>
                                        {Object.keys(capas).map(nombre => (
                                            <SelectItem key={nombre} value={nombre}>{nombre}</SelectItem>
                                        ))}
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
                                <DropdownMenuItem onClick={handleNuevaCapa}><Plus/>Nueva capa</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLimpiarCapa}><MapPinX/>Limpiar capa</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleEliminarCapa}><Trash2/>Eliminar Capa</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Button className="flex-1 md:flex-none" onClick={handleSave}><Save/>Guardar</Button>
                    <Button className="flex-1 md:flex-none" onClick={() => setOpenStairs(true)}><Link/>Conectar escaleras</Button>
                    <ConnectStairsModal open={openStairs} onOpenChange={setOpenStairs} onConnect={handleConnectStairs} />
                </div>
            </div>
        </div>
    )
}