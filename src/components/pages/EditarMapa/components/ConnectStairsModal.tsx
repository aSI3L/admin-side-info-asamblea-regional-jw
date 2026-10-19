import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useGrafoMapaStore } from "@/zustand/grafo-mapa.store";
import { useEditMapEdificio } from "@/hooks/useEditMapEdificio";
import { loadMapLayers } from "@/services/map-graph.service";
import { Button } from "@/components/ui/button";
import { getIcono, iconoUrl, tamanoIconoPunto } from "@/consts/iconos.consts";
import { nombreEnUnaLinea } from "@/lib/etiquetas";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from "@/components/ui/select";
import type { Node, PointOfInterest, Vector } from "@/types/mapas.type";
import { Link2, X } from "lucide-react";

type CapaDatos = { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] };

type ConnectStairsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** pares de nodos (de distinto nivel) a unir */
  onConnect: (pares: [string, string][]) => void;
};

// Tamaño mínimo de los iconos en este diálogo (unidades del mapa), para que se puedan tocar
const ICONO_MIN = 56;

const esCambioDeNivel = (poi: PointOfInterest) => !!getIcono(poi.icon)?.cambioNivel || /escalera|ascensor/i.test(poi.name);

export function ConnectStairsModal({ open, onOpenChange, onConnect }: ConnectStairsModalProps) {
  const { edificio } = useEditMapEdificio();
  const nivelActivo = useGrafoMapaStore(state => state.nivelActivo);
  const capaActiva = useGrafoMapaStore(state => state.capaActiva);
  const nodesActuales = useGrafoMapaStore(state => state.nodes);
  const connectionsActuales = useGrafoMapaStore(state => state.connections);
  const poisActuales = useGrafoMapaStore(state => state.pois);
  const disconnectNodes = useGrafoMapaStore(state => state.disconnectNodes);

  const [guardadas, setGuardadas] = useState<Record<string, Record<string, CapaDatos>>>({}); // [nivel][capa]
  const [capasPorNivel, setCapasPorNivel] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);

  const niveles = useMemo(
    () => Object.keys(edificio?.planos || {}).sort((a, b) => Number(a) - Number(b)),
    [edificio?.planos]
  );

  // Cargar las capas guardadas de todos los niveles al abrir
  useEffect(() => {
    if (!open || !edificio?.id) return;
    setSelected([]);
    setCargando(true);
    Promise.all(niveles.map(async nivel => [nivel, await loadMapLayers({ edificioId: edificio.id as string, nivel })] as const))
      .then(resultado => setGuardadas(Object.fromEntries(resultado)))
      .finally(() => setCargando(false));
  }, [open, edificio?.id, niveles]);

  const capaDe = (nivel: string) =>
    capasPorNivel[nivel] || (nivel === nivelActivo && capaActiva) || Object.keys(guardadas[nivel] || {})[0] || "";

  // Datos de cada nivel: el que se está editando usa lo que hay en pantalla (aunque no esté guardado)
  const datosPorNivel = useMemo(() => {
    const out: Record<string, CapaDatos> = {};
    for (const nivel of niveles) {
      const capa = capasPorNivel[nivel] || (nivel === nivelActivo && capaActiva) || Object.keys(guardadas[nivel] || {})[0] || "";
      out[nivel] = nivel === nivelActivo && capa === capaActiva
        ? { nodes: nodesActuales, connections: connectionsActuales, pois: poisActuales }
        : guardadas[nivel]?.[capa] || { nodes: [], connections: [], pois: [] };
    }
    return out;
  }, [niveles, capasPorNivel, nivelActivo, capaActiva, guardadas, nodesActuales, connectionsActuales, poisActuales]);

  // Nivel de cada nodo, nombre de cada punto
  const nivelDeNodo = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [nivel, datos] of Object.entries(datosPorNivel)) datos.nodes.forEach(n => { m[n.node] = nivel; });
    return m;
  }, [datosPorNivel]);
  const poiPorNodo = useMemo(() => {
    const m: Record<string, PointOfInterest> = {};
    for (const datos of Object.values(datosPorNivel)) datos.pois.forEach(p => { m[p.node] = p; });
    return m;
  }, [datosPorNivel]);

  // Conexiones existentes entre niveles, con una letra por par para identificarlas en los planos
  const conexiones = useMemo(() => {
    const vistas = new Set<string>();
    const lista: { origen: string; destino: string; letra: string; editable: boolean }[] = [];
    for (const [nivel, datos] of Object.entries(datosPorNivel)) {
      for (const c of datos.connections) {
        const nO = nivelDeNodo[c.origen], nD = nivelDeNodo[c.destino];
        if (!nO || !nD || nO === nD) continue;
        const clave = [c.origen, c.destino].sort().join("|");
        if (vistas.has(clave)) continue;
        vistas.add(clave);
        // Solo se puede quitar desde aquí si está guardada en la capa que se está editando
        const editable = nivel === nivelActivo && capaDe(nivel) === capaActiva;
        lista.push({ origen: c.origen, destino: c.destino, letra: String.fromCharCode(65 + (lista.length % 26)), editable });
      }
    }
    return lista;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datosPorNivel, nivelDeNodo, nivelActivo, capaActiva]);
  const letrasDeNodo = useMemo(() => {
    const m: Record<string, string[]> = {};
    conexiones.forEach(c => { (m[c.origen] ??= []).push(c.letra); (m[c.destino] ??= []).push(c.letra); });
    return m;
  }, [conexiones]);

  const toggleSelect = (id: string) => {
    setSelected(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id]);
  };

  // Solo se unen puntos de niveles distintos
  const pares = useMemo(() => {
    const out: [string, string][] = [];
    for (let i = 0; i < selected.length; i++)
      for (let j = i + 1; j < selected.length; j++)
        if (nivelDeNodo[selected[i]] !== nivelDeNodo[selected[j]]) out.push([selected[i], selected[j]]);
    return out;
  }, [selected, nivelDeNodo]);

  const handleConnect = () => {
    if (!pares.length) return;
    onConnect(pares);
    setSelected([]);
    onOpenChange(false);
  };

  const nombre = (id: string) => `${poiPorNodo[id] ? nombreEnUnaLinea(poiPorNodo[id].name) : "Punto"} (N${nivelDeNodo[id]})`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogTitle>Conectar escaleras/ascensores</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Tocá en cada nivel la escalera o el ascensor que se conectan entre sí. Aparecen los puntos con icono de escaleras o ascensor (o con esa palabra en el nombre).
            Las letras marcan las conexiones que ya existen. Después de conectar, tocá Guardar.
          </p>

          {niveles.length === 0 && <div className="text-sm text-muted-foreground">No hay niveles.</div>}
          <div className="grid gap-3 md:grid-cols-2">
            {niveles.map(nivel => {
              const datos = datosPorNivel[nivel];
              const escaleras = datos.pois.filter(esCambioDeNivel);
              const capas = Object.keys(guardadas[nivel] || {});
              return (
                <div key={nivel} className="rounded-lg border p-2">
                  <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                    Nivel {nivel}
                    {nivel === nivelActivo && <span className="text-xs font-normal text-muted-foreground">(el que estás editando)</span>}
                    <div className="ml-auto">
                      <Select value={capaDe(nivel)} onValueChange={capa => setCapasPorNivel(prev => ({ ...prev, [nivel]: capa }))}>
                        <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Capa" /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Capas</SelectLabel>
                            {capas.map(capa => <SelectItem key={capa} value={capa}>{capa}</SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <svg viewBox="0 0 800 800" className="block w-full rounded-md bg-white">
                    {edificio?.planos?.[nivel] && <image href={edificio.planos[nivel]} x={0} y={0} width={800} height={800} />}
                    {/* Resto de los iconos, tenues, como referencia */}
                    {datos.pois.filter(p => p.icon && !esCambioDeNivel(p)).map(p => {
                      const s = tamanoIconoPunto(edificio?.escalaIconos, p.escala);
                      return <image key={p.node} href={iconoUrl(p.icon as string)} x={p.x - s / 2} y={p.y - s / 2} width={s} height={s} opacity={0.3} />;
                    })}
                    {/* Escaleras y ascensores: se tocan para elegirlos */}
                    {escaleras.map(p => {
                      const s = Math.max(ICONO_MIN, tamanoIconoPunto(edificio?.escalaIconos, p.escala));
                      const orden = selected.indexOf(p.node);
                      const elegido = orden >= 0;
                      const letras = letrasDeNodo[p.node];
                      return (
                        <g key={p.node} onClick={() => toggleSelect(p.node)} className="cursor-pointer" role="button" aria-pressed={elegido} aria-label={`${nombreEnUnaLinea(p.name)}, nivel ${nivel}`}>
                          <title>{nombreEnUnaLinea(p.name)}</title>
                          <rect x={p.x - s / 2 - 8} y={p.y - s / 2 - 8} width={s + 16} height={s + 16} rx={14}
                            fill={elegido ? "rgba(37,99,235,0.25)" : "rgba(255,255,255,0.75)"} stroke={elegido ? "#2563eb" : "#64748b"} strokeWidth={elegido ? 6 : 2} />
                          {p.icon
                            ? <image href={iconoUrl(p.icon)} x={p.x - s / 2} y={p.y - s / 2} width={s} height={s} />
                            : <circle cx={p.x} cy={p.y} r={s / 3} fill="#2563eb" />}
                          <text x={p.x} y={p.y + s / 2 + 26} textAnchor="middle" fontSize={22} fontWeight="bold" fontFamily="Arial"
                            fill="#111" stroke="#fff" strokeWidth={5} paintOrder="stroke">{nombreEnUnaLinea(p.name)}</text>
                          {letras && (
                            <g>
                              <circle cx={p.x + s / 2 + 4} cy={p.y - s / 2 - 4} r={17} fill="#16a34a" stroke="#fff" strokeWidth={3} />
                              <text x={p.x + s / 2 + 4} y={p.y - s / 2 - 4} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight="bold" fill="#fff">{letras.join("")}</text>
                            </g>
                          )}
                          {elegido && (
                            <g>
                              <circle cx={p.x - s / 2 - 4} cy={p.y - s / 2 - 4} r={17} fill="#2563eb" stroke="#fff" strokeWidth={3} />
                              <text x={p.x - s / 2 - 4} y={p.y - s / 2 - 4} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight="bold" fill="#fff">{orden + 1}</text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                    {!cargando && escaleras.length === 0 && (
                      <text x={400} y={400} textAnchor="middle" fontSize={26} fill="#475569" stroke="#fff" strokeWidth={6} paintOrder="stroke">
                        Sin escaleras ni ascensores en este nivel
                      </text>
                    )}
                  </svg>
                </div>
              );
            })}
          </div>

          {/* Selección actual */}
          <div className="text-sm">
            {selected.length === 0
              ? <span className="text-muted-foreground">Elegí al menos un punto en dos niveles distintos.</span>
              : <span>Seleccionados: {selected.map((id, i) => `${i + 1}. ${nombre(id)}`).join(" · ")}</span>}
            {selected.length >= 2 && pares.length === 0 && (
              <span className="block text-xs font-semibold">Los puntos elegidos están en el mismo nivel: elegí otro en un nivel distinto.</span>
            )}
          </div>

          {/* Conexiones existentes */}
          {conexiones.length > 0 && (
            <div className="space-y-1 text-sm">
              <div className="font-semibold">Conexiones existentes</div>
              <ul className="space-y-1">
                {conexiones.map(c => (
                  <li key={`${c.origen}|${c.destino}`} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">{c.letra}</span>
                    <Link2 className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{nombre(c.origen)} ↔ {nombre(c.destino)}</span>
                    {c.editable ? (
                      <button type="button" onClick={() => disconnectNodes(c.origen, c.destino)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs underline cursor-pointer">
                        <X className="h-3.5 w-3.5" />Quitar
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">se quita desde el otro nivel</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button className="bg-white hover:bg-secondary/80 text-primary" onClick={handleConnect} disabled={pares.length === 0}>
              <Link2 />Conectar seleccionados
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
