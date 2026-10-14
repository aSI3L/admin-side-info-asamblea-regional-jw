// Conversión de croquis subidos (SVG, PNG, JPG, WEBP) a data URL cuadrada.
//
// Todo el sistema de mapas (editor, visor y el sitio público) trabaja sobre un lienzo
// de 800x800. Para que un croquis apaisado no se deforme ni se desalinee con los nodos,
// se centra dentro de un cuadrado blanco antes de guardarlo.

export const CROQUIS_ACCEPT = "image/svg+xml,image/png,image/jpeg,image/webp"

// Firestore limita cada documento a 1 MiB y todos los planos viven en el doc del edificio
export const MAX_CROQUIS_BYTES = 300 * 1024

const MAX_RASTER_SIDE = 1600

const svgToDataUrl = (svg: string) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`

/** Centra el SVG dentro de un lienzo cuadrado. Devuelve el SVG resultante como texto. */
export function cuadrarSvg(svg: string): string {
    const limpio = svg.replace(/<\?xml[^>]*\?>/, "").replace(/<!DOCTYPE[^>]*>/i, "").trim()
    const raiz = limpio.match(/<svg\b[^>]*>/i)
    if (!raiz) throw new Error("El archivo no es un SVG válido")

    const attr = (nombre: string) => raiz[0].match(new RegExp(`\\s${nombre}\\s*=\\s*"([^"]*)"`, "i"))?.[1]
    const viewBox = attr("viewBox")?.split(/[\s,]+/).map(Number)
    const w = viewBox?.[2] ?? parseFloat(attr("width") ?? "")
    const h = viewBox?.[3] ?? parseFloat(attr("height") ?? "")
    if (!w || !h) throw new Error("El SVG no indica su tamaño (viewBox o width/height)")

    const lado = Math.max(w, h)
    const x = (lado - w) / 2
    const y = (lado - h) / 2
    const raizSinTamano = raiz[0]
        .replace(/\s(width|height|x|y)\s*=\s*"[^"]*"/gi, "")
        .replace(/>$/, ` x="${x}" y="${y}" width="${w}" height="${h}"${viewBox ? "" : ` viewBox="0 0 ${w} ${h}"`}>`)

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" width="${lado}" height="${lado}">` +
        `<rect width="${lado}" height="${lado}" fill="#fff"/>` +
        limpio.replace(raiz[0], raizSinTamano) +
        `</svg>`
}

const cargarImagen = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("No se pudo leer la imagen"))
    img.src = src
})

async function cuadrarRaster(file: File): Promise<string> {
    const objectUrl = URL.createObjectURL(file)
    try {
        const img = await cargarImagen(objectUrl)
        const escala = Math.min(1, MAX_RASTER_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.round(img.naturalWidth * escala)
        const h = Math.round(img.naturalHeight * escala)
        const lado = Math.max(w, h)
        const canvas = document.createElement("canvas")
        canvas.width = lado
        canvas.height = lado
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("No se pudo procesar la imagen")
        ctx.fillStyle = "#fff"
        ctx.fillRect(0, 0, lado, lado)
        ctx.drawImage(img, (lado - w) / 2, (lado - h) / 2, w, h)

        // Bajar la calidad hasta que entre en el límite
        for (const calidad of [0.85, 0.7, 0.55, 0.4]) {
            const dataUrl = canvas.toDataURL("image/webp", calidad)
            if (dataUrl.length <= MAX_CROQUIS_BYTES) return dataUrl
        }
        throw new Error("La imagen es demasiado grande incluso comprimida. Probá con un SVG o una imagen más chica.")
    } finally {
        URL.revokeObjectURL(objectUrl)
    }
}

/** Convierte el archivo subido en una data URL cuadrada lista para guardar en `planos`. */
export async function procesarCroquis(file: File): Promise<string> {
    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
        const dataUrl = svgToDataUrl(cuadrarSvg(await file.text()))
        if (dataUrl.length > MAX_CROQUIS_BYTES) {
            throw new Error(`El SVG pesa ${Math.round(dataUrl.length / 1024)} KB y el máximo es ${MAX_CROQUIS_BYTES / 1024} KB. Simplificalo o exportalo como PNG.`)
        }
        return dataUrl
    }
    if (!CROQUIS_ACCEPT.split(",").includes(file.type)) {
        throw new Error("Formato no admitido. Usá SVG, PNG, JPG o WEBP.")
    }
    return cuadrarRaster(file)
}
