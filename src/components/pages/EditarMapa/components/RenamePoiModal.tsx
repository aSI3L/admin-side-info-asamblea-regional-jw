import { useState, useEffect } from "react";
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ESCALA_ICONO_PROPIA, IconoMapa, iconoUrl } from "@/consts/iconos.consts";
import { DISTANCIA_ETIQUETA, ETIQUETA_DEFECTO, limpiarNombre } from "@/lib/etiquetas";
import type { Etiqueta, PosicionEtiqueta } from "@/types/mapas.type";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Move, Trash2 } from "lucide-react";

const POSICIONES: { id: Exclude<PosicionEtiqueta, "libre">; nombre: string; Icono: typeof ArrowUp }[] = [
  { id: "arriba", nombre: "Arriba", Icono: ArrowUp },
  { id: "abajo", nombre: "Abajo", Icono: ArrowDown },
  { id: "izquierda", nombre: "Izquierda", Icono: ArrowLeft },
  { id: "derecha", nombre: "Derecha", Icono: ArrowRight },
];

export function RenamePoiModal({ open, onOpenChange, initialName, initialIcon, initialEtiqueta, initialEscala, escalaEdificio, iconos, onConfirm, onDelete }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialIcon?: string;
  initialEtiqueta?: Etiqueta;
  initialEscala?: number;
  /** escala general de los iconos del edificio (para mostrar el tamaño final) */
  escalaEdificio: number;
  iconos: IconoMapa[];
  onConfirm: (name: string, icon: string | undefined, etiqueta: Etiqueta, escala: number | undefined) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initialName || "");
  const [icon, setIcon] = useState<string | undefined>(initialIcon);
  const [etiqueta, setEtiqueta] = useState<Etiqueta>({ ...ETIQUETA_DEFECTO, ...initialEtiqueta });
  const [escala, setEscala] = useState(initialEscala ?? ESCALA_ICONO_PROPIA.defecto);

  // Reset when modal opens
  useEffect(() => {
    setName(initialName || "");
    setIcon(initialIcon);
    setEtiqueta({ ...ETIQUETA_DEFECTO, ...initialEtiqueta });
    setEscala(initialEscala ?? ESCALA_ICONO_PROPIA.defecto);
  }, [open, initialName, initialIcon, initialEtiqueta, initialEscala]);

  const confirmar = () => {
    if (!name.trim()) return;
    // El tamaño por defecto no se guarda: así sigue cualquier cambio de la escala general
    onConfirm(limpiarNombre(name), icon, etiqueta, escala === ESCALA_ICONO_PROPIA.defecto ? undefined : escala);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle>Punto de interés</DialogTitle>
          <label className="text-sm font-medium mt-2">Nombre (es el que se ve en el visor y en las referencias)</label>
          {/* Enter confirma; Shift+Enter agrega un salto de línea (así se ve el nombre sobre el mapa) */}
          <textarea
            className="w-full resize-none border rounded px-2 py-1 placeholder:text-muted-foreground"
            placeholder="Ej: Baños Norte"
            rows={Math.min(4, Math.max(2, name.split("\n").length))}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); confirmar(); } }}
            autoFocus
          />
          <p className="text-xs text-muted-foreground mb-2">Shift+Enter para partir el nombre en varias líneas sobre el mapa.</p>
          <label className="text-sm font-medium">Icono</label>
          <div className="grid grid-cols-6 gap-1.5 max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => setIcon(undefined)}
              className={`h-12 rounded-md border text-[10px] leading-tight cursor-pointer ${icon === undefined ? "ring-2 ring-current" : "opacity-80 hover:opacity-100"}`}
            >
              Sin icono
            </button>
            {iconos.map(i => (
              <button
                key={i.id}
                type="button"
                title={i.nombre}
                onClick={() => setIcon(i.id)}
                className={`h-12 rounded-md flex items-center justify-center cursor-pointer ${icon === i.id ? "ring-2 ring-current" : "opacity-60 hover:opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconoUrl(i.id)} alt={i.nombre} className="h-10 w-10" />
              </button>
            ))}
          </div>

          {/* ── Tamaño propio del icono ── */}
          {icon && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="escala-icono" className="text-sm font-medium">Tamaño de este icono</label>
                {escala !== ESCALA_ICONO_PROPIA.defecto && (
                  <button type="button" className="text-xs underline cursor-pointer" onClick={() => setEscala(ESCALA_ICONO_PROPIA.defecto)}>
                    Igual que los demás
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="escala-icono"
                  type="range"
                  min={ESCALA_ICONO_PROPIA.min}
                  max={ESCALA_ICONO_PROPIA.max}
                  step={ESCALA_ICONO_PROPIA.paso}
                  value={escala}
                  onChange={e => setEscala(Number(e.target.value))}
                  className="flex-1 cursor-pointer"
                />
                <span className="w-12 text-right font-mono text-xs">{Math.round(escala * 100)}%</span>
                {/* Vista previa: tamaño final respecto de un icono normal del edificio */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={iconoUrl(icon)} alt="" style={{ width: `${Math.min(56, 28 * escala)}px`, height: `${Math.min(56, 28 * escala)}px` }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Relativo al tamaño general del edificio ({Math.round(escalaEdificio * 100)}%): queda en {Math.round(escalaEdificio * escala * 100)}%.
              </p>
            </div>
          )}

          {/* ── Nombre sobre el mapa ── */}
          <div className="flex items-center justify-between mt-2">
            <label htmlFor="mostrar-nombre" className="text-sm font-medium cursor-pointer">Mostrar el nombre en el mapa</label>
            <Switch
              id="mostrar-nombre"
              checked={etiqueta.visible}
              onCheckedChange={visible => setEtiqueta(e => ({ ...e, visible }))}
            />
          </div>
          {etiqueta.visible && (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1.5">
                {POSICIONES.map(({ id, nombre, Icono }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEtiqueta(e => ({ ...e, posicion: id }))}
                    className={`flex flex-col items-center gap-0.5 rounded-md border py-1.5 text-xs cursor-pointer ${etiqueta.posicion === id ? "ring-2 ring-current" : "opacity-80 hover:opacity-100"}`}
                  >
                    <Icono className="h-4 w-4" />{nombre}
                  </button>
                ))}
              </div>
              {etiqueta.posicion === "libre" ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Move className="h-3.5 w-3.5 shrink-0" />Posición libre (la arrastraste en el plano). Elegí una dirección para volver a una posición fija.
                </p>
              ) : (
                <div className="flex items-center gap-3 text-sm">
                  <label htmlFor="distancia-nombre" className="whitespace-nowrap">Distancia</label>
                  <input
                    id="distancia-nombre"
                    type="range"
                    min={DISTANCIA_ETIQUETA.min}
                    max={DISTANCIA_ETIQUETA.max}
                    value={etiqueta.distancia}
                    onChange={e => setEtiqueta(et => ({ ...et, distancia: Number(e.target.value) }))}
                    className="flex-1 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground w-16 text-right">{etiqueta.distancia === 0 ? "pegado" : etiqueta.distancia < 15 ? "cerca" : etiqueta.distancia < 35 ? "media" : "lejos"}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">También podés arrastrar el nombre directamente sobre el plano.</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-4">
            {onDelete ? (
              <Button variant="destructive" onClick={() => { onDelete(); onOpenChange(false); }}>
                <Trash2 />Eliminar punto
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button className="bg-white hover:bg-secondary/80 text-primary" onClick={confirmar} disabled={!name.trim()}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
