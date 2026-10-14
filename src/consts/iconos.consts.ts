// Biblioteca de iconos común a todos los edificios.
// Para agregar uno: copiar el SVG (64x64) a public/iconos/<id>.svg y sumarlo a esta lista.

export interface IconoMapa {
    id: string
    nombre: string
    /** Iconos que marcan un cambio de nivel (se ofrecen en "Conectar escaleras") */
    cambioNivel?: boolean
}

export const ICONOS: IconoMapa[] = [
    { id: "acceso", nombre: "Acceso" },
    { id: "informacion", nombre: "Información" },
    { id: "primeros-auxilios", nombre: "Primeros auxilios" },
    { id: "sanitarios", nombre: "Sanitarios" },
    { id: "sanitarios-varones", nombre: "Sanitarios varones" },
    { id: "sanitarios-mujeres", nombre: "Sanitarios mujeres" },
    { id: "lactancia", nombre: "Lactancia" },
    { id: "vestuarios", nombre: "Vestuarios" },
    { id: "acomodadores", nombre: "Acomodadores" },
    { id: "guardarropas", nombre: "Guardarropas" },
    { id: "accesibilidad", nombre: "Accesibilidad" },
    { id: "limpieza", nombre: "Limpieza" },
    { id: "servicio-voluntario", nombre: "Servicio voluntario" },
    { id: "plataforma", nombre: "Plataforma" },
    { id: "bebederos", nombre: "Bebederos" },
    { id: "escaleras", nombre: "Escaleras", cambioNivel: true },
    { id: "ascensor", nombre: "Ascensor", cambioNivel: true },
]

export const iconoUrl = (id: string) => `/iconos/${id}.svg`

// Tamaño de los iconos sobre el mapa, en unidades del lienzo (800x800), no en píxeles de pantalla:
// así mantienen la proporción con el croquis en cualquier pantalla y con cualquier zoom.
export const ICONO_TAMANO_BASE = 30
export const ESCALA_ICONOS = { min: 0.4, max: 3, paso: 0.1, defecto: 1 }

export const tamanoIcono = (escala?: number) => ICONO_TAMANO_BASE * (escala ?? ESCALA_ICONOS.defecto)

// Ajuste individual de un icono, relativo a la escala general del edificio
export const ESCALA_ICONO_PROPIA = { min: 0.4, max: 2.5, paso: 0.1, defecto: 1 }

/** Tamaño final de un icono: escala general del edificio × escala propia del punto */
export const tamanoIconoPunto = (escalaEdificio: number | undefined, escalaPropia: number | undefined) =>
    tamanoIcono(escalaEdificio) * (escalaPropia ?? ESCALA_ICONO_PROPIA.defecto)

export const getIcono = (id?: string) => ICONOS.find(i => i.id === id)
