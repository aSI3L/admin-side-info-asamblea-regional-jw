import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export function Instructions() {
    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm w-full">
            <CardHeader className="-mb-3">
                <CardTitle className="flex items-center gap-2 text-xl"><Info />Instrucciones</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
                <div className="flex gap-2 items-center">
                    <Badge>1</Badge>
                    <span>Haga <b>click en el plano vacío</b> para crear un nodo nuevo (punto libre donde quieras).</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>2</Badge>
                    <span>Haga <b>click en un nodo y luego en otro</b> para conectar o desconectar un camino entre ambos.</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>3</Badge>
                    <span>Haga <b>doble click en un nodo</b> para nombrarlo como punto de interés (ejemplo: Escalera Este)</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>4</Badge>
                    <span>Para <b>eliminar un nodo</b> presione <b>Ctrl + Shift + Click sobre el nodo a eliminar</b>.</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>5</Badge>
                    <span>Para <b>conectar escaleras</b> presione el botón: Conectar Escaleras.</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>6</Badge>
                    <span>Mantenga presionado <b>Shift</b> para activar el <b>snap angular a 45°</b> mientras dibuja desde un nodo seleccionado.</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>7</Badge>
                    <span><b>Arrastre</b> cualquier nodo con el mouse para reubicarlo de forma precisa.</span>
                </div>
            </CardContent>
        </Card>
    )
}