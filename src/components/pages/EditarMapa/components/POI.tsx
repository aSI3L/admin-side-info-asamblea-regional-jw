import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin } from "lucide-react";

export function POI() {
    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="-mb-3">
                <CardTitle className="flex items-center gap-2 text-xl"><MapPin/>Puntos de Interés</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64 rounded-md border p-4">
                    <ul className="flex flex-col gap-1">
                        <li>
                            <Badge className="text-sm">Primeros Auxilios</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Acomodadores</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                        <li>
                            <Badge className="text-sm">Guardarropas</Badge>
                        </li>
                    </ul>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}