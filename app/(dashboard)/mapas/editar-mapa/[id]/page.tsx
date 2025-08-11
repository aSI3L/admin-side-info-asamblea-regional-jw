import { EditarMapaPage } from "@/components/pages/EditarMapa/EditarMapaPage";
import { use } from "react";

export default function EditarMapa({ params }: { params: Promise<{ id: string }>}) {
    const { id } = use(params);
    return (
        <EditarMapaPage idEdificio={id} />
    )
}