import { Card, CardContent } from "@/components/ui/card";
import { useEditMapEdificio } from "@/hooks/useEditMapEdificio";
import Image from "next/image";

export function MapEditor() {
    const { level } = useEditMapEdificio()
    return (
        <Card className="py-2">
            <CardContent className="px-2 relative">
                { 
                    level !== "" ? (<><Image
                        src={level}
                        alt="Mapa"
                        className="w-full h-auto object-cover rounded-md"
                        width={800}
                        height={800}
                    />
                    <canvas
                        // ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-auto rounded-xl z-20 px-2"
                        // onClick={handleCanvasClick}
                        // onDoubleClick={handleCanvasDoubleClick}
                    /></>)
                    : 
                    (<></>)
                }
            </CardContent>
        </Card>
    )
}