import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin } from "lucide-react";
import { useGrafoMapaStore } from "@/zustand/grafo-mapa.store";

export function POI() {
    const pois = useGrafoMapaStore(state => state.pois);
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
                            <li key={poi.node}>
                                <Badge className="text-sm">{poi.name}</Badge>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}