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
                    <span>Para <b>ubicar un área</b>, elija su icono en la barra sobre el plano y haga <b>click donde va</b>. Póngale el nombre que verá el público (ej: Baños Norte).</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>2</Badge>
                    <span>En modo <b>Caminos</b>, haga <b>click en el plano vacío</b> para crear un punto de paso en pasillos y zonas de circulación.</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>3</Badge>
                    <span>Haga <b>click en un nodo o icono y luego en otro</b> para conectar o desconectar un tramo entre ambos.</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>4</Badge>
                    <span>Al <b>seleccionar un icono o nodo</b> aparecen los botones <b>Editar</b> (nombre, icono y dónde se muestra el nombre) y <b>Eliminar</b>. También están en la lista de puntos, con <b>doble click</b> o con la tecla <b>Supr</b>.</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>5</Badge>
                    <span><b>Arrastre el nombre</b> de un icono para ubicarlo donde quiera. En Editar puede ocultarlo o ponerlo arriba, abajo o a un costado, más cerca o más lejos, y cambiar el <b>tamaño de ese icono</b>.</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>6</Badge>
                    <span>Para <b>conectar niveles</b>, coloque iconos de escaleras o ascensor en cada nivel y guarde. En <b>Conectar Escaleras</b> toque sobre los planos la escalera de cada nivel que se conectan, y luego Guardar.</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>7</Badge>
                    <span>Mantenga presionado <b>Shift</b> para activar el <b>snap angular a 45°</b> mientras dibuja desde un nodo seleccionado.</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge>8</Badge>
                    <span><b>Arrastre</b> cualquier nodo o icono con el mouse para reubicarlo de forma precisa.</span>
                </div>
            </CardContent>
        </Card>
    )
}