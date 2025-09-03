import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditMapEdificio } from "@/hooks/useEditMapEdificio";
import { Ellipsis, Link, MapPinX, Plus, Save, Trash2 } from "lucide-react";
import { useGrafoMapaStore } from "@/zustand/grafo-mapa.store";
import { saveMapLayer, loadMapLayers } from "@/services/map-graph.service";
import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { setActiveLayer, getActiveLayer } from "@/services/map-graph.service";
import { toast } from "sonner";
import { ConnectStairsModal } from "./ConnectStairsModal";
    

    export function ActionButtons() {
        // Declarar todos los selectores y hooks personalizados al inicio
        const { edificio, level, setLevel } = useEditMapEdificio();
        const nivelActivo = useGrafoMapaStore(state => state.nivelActivo);
        const nodes = useGrafoMapaStore(state => state.nodes);
        const connections = useGrafoMapaStore(state => state.connections);
        const pois = useGrafoMapaStore(state => state.pois);
        const setAll = useGrafoMapaStore(state => state.setAll);
        const connectNodes = useGrafoMapaStore(state => state.connectNodes);
        const capas = useGrafoMapaStore(state => state.capas);
        const crearCapa = useGrafoMapaStore(state => state.crearCapa);
        const capaActiva = useGrafoMapaStore(state => state.capaActiva);
        const setCapaActiva = useGrafoMapaStore(state => state.setCapaActiva);

        const [isCapaActiva, setIsCapaActiva] = useState(false);

        // Sincronizar switch con Firestore
        useEffect(() => {
            if (!edificio?.id || !nivelActivo || !capaActiva) {
                setIsCapaActiva(false);
                return;
            }
            getActiveLayer({ edificioId: edificio.id, nivel: nivelActivo }).then(capaFirestore => {
                setIsCapaActiva(capaFirestore === capaActiva);
            });
        }, [edificio?.id, nivelActivo, capaActiva]);

 

 

    const convertPlanosToArray = (planosObj: Record<string, string> | undefined): { url: string }[] => {
        if (!planosObj) return [{ url: "" }];
        return Object.values(planosObj).map(url => ({ url }));
    };


    useEffect(() => {
        if (!edificio?.id || !nivelActivo || !capaActiva) {
            setIsCapaActiva(false);
            return;
        }
        getActiveLayer({ edificioId: edificio.id, nivel: nivelActivo }).then(capaFirestore => {
            setIsCapaActiva(capaFirestore === capaActiva);
        });
    }, [edificio?.id, nivelActivo, capaActiva]);

    const handleSwitchChange = useCallback(async (checked: boolean) => {
        setIsCapaActiva(checked);
        if (checked && edificio?.id && nivelActivo && capaActiva) {
            await setActiveLayer({ edificioId: edificio.id, nivel: nivelActivo, capaActiva });
            toast.success("Capa marcada como activa para este nivel");
        }
    }, [edificio?.id, nivelActivo, capaActiva]);

    // Sincronizar capa activa con el nivel: si la capa activa no existe en el nuevo nivel, setear la primera capa o vacío
    useEffect(() => {
        const capasNivel = capas[nivelActivo] || {};
        const capaNames = Object.keys(capasNivel);
        if (!capaActiva || !capasNivel[capaActiva]) {
            if (capaNames.length > 0) {
                setCapaActiva(capaNames[0]);
            } else {
                setCapaActiva("");
            }
        }
    }, [capas, nivelActivo, capaActiva, setCapaActiva]);

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
        // Generar nombre único por nivel
        let idx = 1;
        let nombre = `Capa ${idx}`;
        const capasNivel = capas[nivelActivo] || {};
        while (capasNivel[nombre]) {
            idx++;
            nombre = `Capa ${idx}`;
        }
        crearCapa(nombre);
        setCapaActiva(nombre);
    };

    const handleLimpiarCapa = () => {
        setAll({ nodes: [], connections: [], pois: [] });
    };

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const handleEliminarCapa = async () => {
        if (!capaActiva || !nivelActivo || !capas[nivelActivo]) return;
        // Eliminar de Firestore
        try {
            const { doc, deleteDoc } = await import("firebase/firestore");
            const { db } = await import("@/config/firebase");
            const capaRef = doc(db, "mapas", `${edificio?.id}_${nivelActivo}`, "capas", capaActiva);
            await deleteDoc(capaRef);
        } catch (e) { /* Si falla, solo borra local */ }

        // Recargar capas desde Firestore y actualizar el store inmediatamente
        if (!edificio?.id) {
            throw new Error("edificio.id is undefined");
        }
        const nuevasCapas = await loadMapLayers({ edificioId: edificio.id, nivel: nivelActivo });
        if (useGrafoMapaStore.getState().setCapasFromFirestore) {
            useGrafoMapaStore.getState().setCapasFromFirestore(nivelActivo, nuevasCapas);
        }
        // Elegir otra capa si existe
        const keys = Object.keys(nuevasCapas);
        if (keys.length > 0) {
            setCapaActiva(keys[0]);
        } else {
            setAll({ nodes: [], connections: [], pois: [] });
            setCapaActiva("");
        }
        setOpenDeleteDialog(false);
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
        if (!capaActiva) {
            alert("Debe seleccionar o crear una capa antes de guardar.");
            return;
        }
        const nivelId = getLevelIndex();
        if (!nivelId) {
            alert("No se pudo determinar el índice del nivel seleccionado");
            return;
        }
        // Ensure every POI has the nivel field set
        const poisWithNivel = pois.map(poi => ({ ...poi, nivel: Number(nivelId) }));
        await saveMapLayer({
            edificioId: edificio.id,
            nivel: nivelId,
            capa: capaActiva,
            nodes,
            connections,
            pois: poisWithNivel,
        });
        toast.success("Capa guardada correctamente en Firestore");
        // Opcional: recargar capas después de guardar
    const nuevasCapas = await loadMapLayers({ edificioId: edificio.id, nivel: nivelId });
    useGrafoMapaStore.getState().setCapasFromFirestore(nivelId, nuevasCapas);
    };

    return (
        <div className="w-full">
                <div className="w-full md:w-auto flex flex-col gap-3 md:flex-row md:justify-start md:items-center">
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
                                            <SelectItem key={plano.url} value={plano.url}>Nivel {index}</SelectItem>
                                        ))
                                    }
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                        <div className="flex-1 md:w-45 flex items-center gap-2">
                            <Select value={capaActiva} onValueChange={setCapaActiva}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccione una capa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Capas</SelectLabel>
                                        {(Object.keys(capas[nivelActivo] || {})).map(nombre => (
                                            <SelectItem key={nombre} value={nombre}>{nombre}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                            <Switch
                                checked={isCapaActiva}
                                onCheckedChange={handleSwitchChange}
                                className="h-6 w-11"
                            />
                            <label htmlFor="switch-capa-activa" className="text-sm select-none cursor-pointer whitespace-nowrap" style={{lineHeight: '1'}}>Capa activa</label>
                        </div>
                        <div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="shrink-0" size="icon"><Ellipsis/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Acciones de capa</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={handleNuevaCapa}><Plus/>Nueva capa</DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleLimpiarCapa}><MapPinX/>Limpiar capa</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setOpenDeleteDialog(true)}><Trash2/>Eliminar Capa</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>¿Eliminar capa?</DialogTitle>
                                        <DialogDescription>
                                            ¿Estás seguro que deseas eliminar la capa <b>{capaActiva}</b>? Esta acción no se puede deshacer.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                                        <Button variant="destructive" onClick={handleEliminarCapa}>Eliminar</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button className="flex-1 md:flex-none" variant="outline" onClick={() => setOpenStairs(true)}><Link/>Conectar escaleras</Button>
                        <Button className="flex-1 md:flex-none bg-white hover:bg-secondary/80 text-primary" onClick={handleSave}><Save/>Guardar</Button>
                        <ConnectStairsModal open={openStairs} onOpenChange={setOpenStairs} onConnect={handleConnectStairs} />
                    </div>
                </div>
        </div>
    );
}