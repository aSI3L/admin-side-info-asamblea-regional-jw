import { COLLECTIONS } from "@/consts/collections.consts";
import { GenericService } from "./generic.service";
import { infoPrincipalAdapter } from "@/adapters/info-principal.adapter";
import { categoriasAdapter } from "@/adapters/categorias.adapter";
import { usuarioAutorizadoAdapter } from "@/adapters/usuario-autorizado.adapter";

export const infoPrincipalService = new GenericService(COLLECTIONS.INFO_PRINCIPAL, infoPrincipalAdapter)
export const categoriasService = new GenericService(COLLECTIONS.CATEGORIAS, categoriasAdapter);
export const usuariosAutorizadosService = new GenericService(COLLECTIONS.USUARIOS_AUTORIZADOS, usuarioAutorizadoAdapter);