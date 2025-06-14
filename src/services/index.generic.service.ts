import { COLLECTIONS } from "@/consts/collections.consts";
import { GenericService } from "./generic.service";
import { infoPrincipalAdapter } from "@/adapters/info-principal.adapter";

export const infoPrincipalService = new GenericService(COLLECTIONS.INFO_PRINCIPAL, infoPrincipalAdapter)