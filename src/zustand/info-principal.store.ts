import { infoPrincipalService } from "@/services/index.generic.service";
import { InfoPrincipalType } from "@/types/info-principal.type";
import { toast } from "sonner";
import { create } from "zustand";

interface InfoPrincipalStore {
    infoPrincipal: InfoPrincipalType
    getInfoPrincipal: () => Promise<void>
    createInfoPrincipal: (id: string, data: InfoPrincipalType) => Promise<void>
    loadingInfoPrincipal: boolean
}

export const useInfoPrincipalStore = create<InfoPrincipalStore>((set) => ({
    infoPrincipal: {
        mainTitle: "",
        year: 0,
        color: {
            primary: "",
            secondary: "",
            accent: ""
        },
        imageUrl: "",
        buildingId: ""
    },
    loadingInfoPrincipal: false,
    getInfoPrincipal: async () => {
        set({ loadingInfoPrincipal: true })
        const infoPrincipalResponse = await infoPrincipalService.getAll()
        if (infoPrincipalResponse && Array.isArray(infoPrincipalResponse) && infoPrincipalResponse.length > 0) {
            set(() => ({ infoPrincipal: infoPrincipalResponse[0], loadingInfoPrincipal: false }))
        } else {
            set(() => ({ loadingInfoPrincipal: false }))
            console.log("Error: Get Info Principal")
        }
    },
    createInfoPrincipal: async (id, data) => {
        const updated = await infoPrincipalService.update(id, data, true)

        if(updated) {
            set(() => ({ infoPrincipal: { ...data, id } }))
            toast.success("Información actualizada correctamente")
        } else {
            toast.error("Ha ocurrido un error al actualizar la información")
        }
    }
}))
