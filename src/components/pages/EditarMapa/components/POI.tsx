import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EyeOff, MapPin, Pencil, Trash2 } from "lucide-react";
import { useGrafoMapaStore } from "@/zustand/grafo-mapa.store";
import { iconoUrl } from "@/consts/iconos.consts";

export function POI() {
    const pois = useGrafoMapaStore(state => state.pois);
    const selectedNode = useGrafoMapaStore(state => state.selectedNode);
    const setSelectedNode = useGrafoMapaStore(state => state.setSelectedNode);
    const setPoiEnEdicion = useGrafoMapaStore(state => state.setPoiEnEdicion);
    const deleteNode = useGrafoMapaStore(state => state.deleteNode);
    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="-mb-3">
                <CardTitle className="flex items-center gap-2 text-xl"><MapPin/>Puntos de Interés</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64 rounded-md border p-4">
                    <ul className="flex flex-col gap-1">
                        {pois.length === 0 && (
                            <li>
                                <Badge className="text-sm">Sin puntos de interés</Badge>
                            </li>
                        )}
                        {pois.map((poi) => (
                            <li
                                key={poi.node}
                                className={`group flex items-center gap-2 rounded-md px-1 ${selectedNode === poi.node ? "bg-blue-100" : ""}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedNode(poi.node)}
                                    className="flex min-w-0 flex-1 items-center gap-2 cursor-pointer text-left"
                                    title="Seleccionar en el plano"
                                >
                                    {poi.icon ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={iconoUrl(poi.icon)} alt="" className="h-6 w-6 shrink-0" />
                                    ) : (
                                        <span className="h-6 w-6 shrink-0" />
                                    )}
                                    <Badge className="text-sm truncate">{poi.name}</Badge>
                                    {poi.etiqueta?.visible === false && (
                                        <EyeOff className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-label="Nombre oculto en el mapa" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPoiEnEdicion(poi.node)}
                                    className="rounded p-1 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                    title="Editar"
                                    aria-label={`Editar ${poi.name}`}
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => deleteNode(poi.node)}
                                    className="rounded p-1 text-red-700 hover:bg-red-100 cursor-pointer"
                                    title="Eliminar"
                                    aria-label={`Eliminar ${poi.name}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
