"use client"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { loadMapLayers } from "@/services/map-graph.service";
import { edificiosService } from "@/services/index.generic.service";
import type { Node, Vector, PointOfInterest } from "@/types/mapas.type";
import { ZoomIn, ZoomOut, Maximize, List, X, ArrowUp, ArrowDown } from "lucide-react";
import { getIcono, iconoUrl, tamanoIconoPunto } from "@/consts/iconos.consts";
import { INTERLINEADO, desfaseLineas, etiquetaDe, layoutEtiqueta, lineasNombre, nombreEnUnaLinea, svgBaseline, tamanoEtiqueta } from "@/lib/etiquetas";

type DatosNivel = { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] };

/** Un tramo de la ruta dentro de un mismo nivel: se dibuja en su propio croquis */
type TramoNivel = { nivel: string; nodos: Node[] };

// Dijkstra sobre el grafo de todos los niveles (los cambios de nivel son aristas comunes)
function dijkstra(nodes: Node[], connections: Vector[], start: string, end: string): string[] {
  const distances: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const queue = new Set<string>();
  nodes.forEach((n) => {
    distances[n.node] = Infinity;
    prev[n.node] = null;
    queue.add(n.node);
  });
  distances[start] = 0;
  while (queue.size > 0) {
    const u = Array.from(queue).reduce((min, n) => distances[n] < distances[min] ? n : min, Array.from(queue)[0]);
    queue.delete(u);
    if (u === end || distances[u] === Infinity) break;
    connections.filter((c) => c.origen === u || c.destino === u).forEach((c) => {
      const v = c.origen === u ? c.destino : c.origen;
      if (!queue.has(v)) return;
      const alt = distances[u] + (c.distancia || 1);
      if (alt < distances[v]) {
        distances[v] = alt;
        prev[v] = u;
      }
    });
  }
  const path: string[] = [];
  let u: string | null = end;
  while (u && prev[u]) {
    path.unshift(u);
    u = prev[u];
  }
  if (u === start) path.unshift(start);
  return path.length > 1 || start === end ? path : [];
}

interface MapVisorProps {
  edificioId: string;
  capa: string;
  from: string;
  to: string;
  onInstructionsChange?: (instructions: string[]) => void;
}

// Animación de la flecha
const VELOCIDAD = 180;          // unidades del mapa por segundo
const PAUSA_CAMBIO_NIVEL = 900; // ms en la escalera antes de seguir en el próximo croquis
const PAUSA_FINAL = 1500;       // ms en el destino antes de reiniciar

const ZOOM = { min: 1, max: 4 };
const ANCHO_PLANO = 640;        // px de cada croquis con zoom 1 (en pantallas angostas, el ancho disponible)

export function MapVisor({ edificioId, capa, from, to, onInstructionsChange }: MapVisorProps) {
  const [levelData, setLevelData] = useState<Record<string, DatosNivel>>({});
  const [planos, setPlanos] = useState<Record<string, string>>({});
  const [escalaIconos, setEscalaIconos] = useState(1);
  const [cargado, setCargado] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showReferencias, setShowReferencias] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const seccionRefs = useRef<(HTMLElement | null)[]>([]);
  const flechaRefs = useRef<(SVGGElement | null)[]>([]);
  const ultimaInteraccion = useRef(0);

  // Cargar planos y la capa de todos los niveles
  useEffect(() => {
    let cancelado = false;
    setCargado(false);
    (async () => {
      const ed = await edificiosService.getById(edificioId);
      if (!ed || cancelado) return;
      const niveles = Object.keys(ed.planos || {});
      const datos: Record<string, DatosNivel> = {};
      for (const n of niveles) {
        const data = (await loadMapLayers({ edificioId, nivel: n }))[capa];
        if (data) datos[n] = { nodes: data.nodes || [], connections: data.connections || [], pois: data.pois || [] };
      }
      if (cancelado) return;
      setPlanos(ed.planos || {});
      setEscalaIconos(ed.escalaIconos ?? 1);
      setLevelData(datos);
      setCargado(true);
    })();
    return () => { cancelado = true; };
  }, [edificioId, capa]);

  // Índices: nivel y datos de cada nodo
  const { nivelDeNodo, nodoPorId, poiPorId } = useMemo(() => {
    const nivelDeNodo: Record<string, string> = {};
    const nodoPorId: Record<string, Node> = {};
    const poiPorId: Record<string, PointOfInterest> = {};
    for (const [nivel, d] of Object.entries(levelData)) {
      d.nodes.forEach(n => { nivelDeNodo[n.node] = nivel; nodoPorId[n.node] = n; });
      d.pois.forEach(p => { poiPorId[p.node] = p; });
    }
    return { nivelDeNodo, nodoPorId, poiPorId };
  }, [levelData]);
  // Nombre de un punto en una sola línea (los saltos de línea son sólo para el mapa)
  const nombreDe = (id: string) => (poiPorId[id] ? nombreEnUnaLinea(poiPorId[id].name) : "");

  // Ruta y su división en tramos por nivel (en orden: origen arriba, destino abajo)
  const path = useMemo(() => {
    if (!cargado || !from || !to) return [];
    const nodes = Object.values(levelData).flatMap(l => l.nodes);
    const conns = Object.values(levelData).flatMap(l => l.connections);
    return dijkstra(nodes, conns, from, to);
  }, [cargado, levelData, from, to]);

  const tramos = useMemo<TramoNivel[]>(() => {
    if (!path.length) {
      // Sin camino: se muestran igual los niveles de origen y destino
      const niveles = Array.from(new Set([nivelDeNodo[from], nivelDeNodo[to]].filter(Boolean)));
      return niveles.map(nivel => ({ nivel, nodos: [] }));
    }
    const out: TramoNivel[] = [];
    for (const id of path) {
      const nivel = nivelDeNodo[id];
      const nodo = nodoPorId[id];
      if (!nivel || !nodo) continue;
      if (out.length && out[out.length - 1].nivel === nivel) out[out.length - 1].nodos.push(nodo);
      else out.push({ nivel, nodos: [nodo] });
    }
    return out;
  }, [path, nivelDeNodo, nodoPorId, from, to]);

  // Instrucciones paso a paso
  useEffect(() => {
    if (!onInstructionsChange || !cargado) return;
    if (!path.length) {
      onInstructionsChange(from && to ? ["No hay un camino cargado que una estos dos puntos."] : []);
      return;
    }
    const pasos: string[] = [`Partida desde: ${nombreDe(from) || "Punto de inicio"}`];
    tramos.forEach((tramo, i) => {
      // Lugares con nombre por los que se pasa (sin repetir origen, destino ni escaleras)
      tramo.nodos.forEach((n, k) => {
        const poi = poiPorId[n.node];
        const esCambioDeNivel = (i > 0 && k === 0) || (i < tramos.length - 1 && k === tramo.nodos.length - 1);
        if (poi && n.node !== from && n.node !== to && !esCambioDeNivel && !getIcono(poi.icon)?.cambioNivel) {
          pasos.push(`Pasá por: ${nombreEnUnaLinea(poi.name)}`);
        }
      });
      const siguiente = tramos[i + 1];
      if (siguiente) {
        const escalera = nombreDe(tramo.nodos[tramo.nodos.length - 1].node) || "la escalera";
        const verbo = Number(siguiente.nivel) > Number(tramo.nivel) ? "subí" : "bajá";
        pasos.push(`Tomá ${escalera} y ${verbo} al Nivel ${siguiente.nivel}`);
      }
    });
    pasos.push(`Llegada a: ${nombreDe(to) || "Destino"}`);
    onInstructionsChange(pasos);
  }, [cargado, path, tramos, poiPorId, from, to, onInstructionsChange]);

  // ── Animación: una línea de tiempo que recorre los tramos en orden ────────
  useEffect(() => {
    flechaRefs.current.forEach(g => g?.setAttribute("visibility", "hidden"));
    if (!path.length) return;

    type Paso = { tramo: number; a: Node; b: Node; inicio: number; dur: number };
    const pasos: Paso[] = [];
    let t = 0;
    tramos.forEach((tramo, i) => {
      for (let k = 0; k < tramo.nodos.length - 1; k++) {
        const a = tramo.nodos[k], b = tramo.nodos[k + 1];
        const dur = (Math.hypot(b.x - a.x, b.y - a.y) / VELOCIDAD) * 1000;
        if (dur > 0) { pasos.push({ tramo: i, a, b, inicio: t, dur }); t += dur; }
      }
      if (i < tramos.length - 1) t += PAUSA_CAMBIO_NIVEL;
    });
    if (!pasos.length) return;
    const total = t + PAUSA_FINAL;

    let raf = 0;
    let inicio: number | null = null;
    let tramoVisible = -1;
    const frame = (ts: number) => {
      if (inicio === null) inicio = ts;
      const ahora = (ts - inicio) % total;
      // Paso actual (o el último que terminó, durante las pausas)
      let paso = pasos[0];
      for (const p of pasos) { if (p.inicio <= ahora) paso = p; else break; }
      const avance = Math.min(1, Math.max(0, (ahora - paso.inicio) / paso.dur));
      const x = paso.a.x + (paso.b.x - paso.a.x) * avance;
      const y = paso.a.y + (paso.b.y - paso.a.y) * avance;
      const angulo = (Math.atan2(paso.b.y - paso.a.y, paso.b.x - paso.a.x) * 180) / Math.PI;

      flechaRefs.current.forEach((g, i) => {
        if (!g) return;
        if (i === paso.tramo) {
          g.setAttribute("visibility", "visible");
          g.setAttribute("transform", `translate(${x},${y}) rotate(${angulo})`);
        } else {
          g.setAttribute("visibility", "hidden");
        }
      });

      // Al pasar a otro croquis, mostrarlo (si la persona no está moviendo el mapa)
      if (paso.tramo !== tramoVisible) {
        tramoVisible = paso.tramo;
        if (Date.now() - ultimaInteraccion.current > 4000) {
          seccionRefs.current[paso.tramo]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [path, tramos]);

  // ── Zoom: agranda el ancho de los croquis; el desplazamiento es el scroll nativo ──
  const centroAntesDelZoom = useRef<{ cx: number; cy: number } | null>(null);
  const cambiarZoom = useCallback((fn: (z: number) => number) => {
    const el = scrollRef.current;
    if (el) {
      centroAntesDelZoom.current = {
        cx: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        cy: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      };
    }
    setZoom(z => Math.min(ZOOM.max, Math.max(ZOOM.min, fn(z))));
  }, []);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const c = centroAntesDelZoom.current;
    if (!el || !c) return;
    el.scrollLeft = c.cx * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = c.cy * el.scrollHeight - el.clientHeight / 2;
    centroAntesDelZoom.current = null;
  }, [zoom]);

  // Pellizco con dos dedos y Ctrl + rueda (listeners no pasivos para poder cancelar el zoom del navegador)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let distInicial: number | null = null;
    const distancia = (e: TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const marcar = () => { ultimaInteraccion.current = Date.now(); };
    const onTouchStart = (e: TouchEvent) => { marcar(); if (e.touches.length === 2) distInicial = distancia(e); };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || distInicial === null) return;
      e.preventDefault();
      const d = distancia(e);
      const factor = d / distInicial;
      distInicial = d;
      cambiarZoom(z => z * factor);
    };
    const onTouchEnd = () => { distInicial = null; };
    const onWheel = (e: WheelEvent) => {
      marcar();
      if (!e.ctrlKey) return;
      e.preventDefault();
      cambiarZoom(z => z * (e.deltaY < 0 ? 1.1 : 0.9));
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", marcar);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", marcar);
    };
  }, [cambiarZoom]);

  // Referencias de los niveles que se muestran
  const referencias = useMemo(() => {
    const niveles = Array.from(new Set(tramos.map(t => t.nivel)));
    return niveles.map(nivel => ({
      nivel,
      items: (levelData[nivel]?.pois || [])
        .filter(p => p.icon)
        .filter((p, i, arr) => arr.findIndex(o => o.icon === p.icon && o.name === p.name) === i)
        .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    })).filter(r => r.items.length);
  }, [tramos, levelData]);

  const botonControl = "w-10 h-10 rounded-full bg-zinc-800/90 backdrop-blur-md text-zinc-100 flex items-center justify-center border border-zinc-700 active:scale-95 transition-transform";

  if (!cargado) {
    return <div className="w-full h-full flex items-center justify-center text-zinc-400">Cargando mapa...</div>;
  }

  return (
    <div className="relative w-full h-full bg-zinc-950 select-none">
      {/* Controles de zoom y referencias */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        <button onClick={() => cambiarZoom(z => z * 1.25)} className={botonControl} aria-label="Acercar"><ZoomIn className="w-5 h-5" /></button>
        <button onClick={() => cambiarZoom(z => z / 1.25)} className={botonControl} aria-label="Alejar"><ZoomOut className="w-5 h-5" /></button>
        <button onClick={() => cambiarZoom(() => 1)} className={botonControl} aria-label="Ajustar a la pantalla"><Maximize className="w-5 h-5" /></button>
        {referencias.length > 0 && (
          <button
            onClick={() => setShowReferencias(v => !v)}
            title="Referencias"
            aria-label="Referencias"
            className={`${botonControl} ${showReferencias ? "!bg-blue-600 !border-blue-500 text-white" : ""}`}
          >
            <List className="w-5 h-5" />
          </button>
        )}
      </div>

      {showReferencias && referencias.length > 0 && (
        <div className="absolute left-16 top-3 z-20 w-60 max-h-[70%] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-md p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Referencias</span>
            <button onClick={() => setShowReferencias(false)} className="text-zinc-400 active:scale-95" aria-label="Cerrar referencias">
              <X className="w-4 h-4" />
            </button>
          </div>
          {referencias.map(r => (
            <div key={r.nivel} className="mb-2 last:mb-0">
              {referencias.length > 1 && <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">Nivel {r.nivel}</div>}
              <ul className="space-y-1.5">
                {r.items.map(ref => (
                  <li key={ref.node} className="flex items-center gap-2 text-sm text-zinc-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconoUrl(ref.icon as string)} alt="" className="w-6 h-6 shrink-0" />
                    <span className="leading-tight">{nombreEnUnaLinea(ref.name)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Croquis de la ruta, uno debajo del otro */}
      <div ref={scrollRef} className="w-full h-full overflow-auto" style={{ touchAction: "pan-x pan-y" }}>
        <div
          className="mx-auto flex flex-col gap-4 px-3 pb-6 pt-3 pl-16"
          style={{ width: `min(${zoom * 100}%, ${zoom * ANCHO_PLANO + 76}px)` }}
        >
          {!path.length && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
              No hay un camino cargado que una estos dos puntos.
            </div>
          )}
          {tramos.map((tramo, i) => {
            const datos = levelData[tramo.nivel];
            const siguiente = tramos[i + 1];
            const anterior = tramos[i - 1];
            const rol = tramos.length === 1 ? "Origen y destino" : i === 0 ? "Origen" : i === tramos.length - 1 ? "Destino" : "De paso";
            const inicio = tramo.nodos[0];
            const fin = tramo.nodos[tramo.nodos.length - 1];
            return (
              <section key={`${tramo.nivel}-${i}`} ref={el => { seccionRefs.current[i] = el; }} className="scroll-mt-3 scroll-mb-3">
                <header className="mb-1.5 flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">Nivel {tramo.nivel}</span>
                  <span className="text-zinc-300">{rol}</span>
                  {siguiente && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-zinc-300">
                      {Number(siguiente.nivel) > Number(tramo.nivel) ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                      Sigue en Nivel {siguiente.nivel}
                    </span>
                  )}
                </header>
                <svg viewBox="0 0 800 800" className="block w-full rounded-xl bg-zinc-900" role="img" aria-label={`Plano del nivel ${tramo.nivel}`}>
                  <defs>
                    <linearGradient id={`ruta-${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4285F4" />
                      <stop offset="100%" stopColor="#0a58ca" />
                    </linearGradient>
                    <filter id={`brillo-${i}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="7" result="coloredBlur" />
                      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id={`sombra-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
                    </filter>
                    <style>{`
                      .ruta-guiones { stroke-dasharray: 16 12; animation: ruta-avance 1.2s linear infinite; }
                      @keyframes ruta-avance { to { stroke-dashoffset: -28; } }
                    `}</style>
                  </defs>
                  {planos[tramo.nivel] && (
                    <image href={planos[tramo.nivel]} x={0} y={0} width={800} height={800} style={{ pointerEvents: "none" }} />
                  )}

                  {/* Recorrido en este nivel */}
                  {tramo.nodos.slice(0, -1).map((a, k) => {
                    const b = tramo.nodos[k + 1];
                    return (
                      <g key={k}>
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#4285F4" strokeWidth={12} opacity={0.5} filter={`url(#brillo-${i})`} />
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={`url(#ruta-${i})`} strokeWidth={7} strokeLinecap="round" />
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth={2.5} className="ruta-guiones" opacity={0.7} />
                      </g>
                    );
                  })}

                  {/* Iconos y nombres del nivel */}
                  {datos?.pois.filter(p => p.icon).map(p => {
                    const node = datos.nodes.find(n => n.node === p.node) ?? p;
                    const esOrigen = p.node === from, esDestino = p.node === to;
                    const size = tamanoIconoPunto(escalaIconos, p.escala) * (esOrigen || esDestino ? 1.3 : 1);
                    const etiqueta = etiquetaDe(p);
                    const layout = etiqueta.visible ? layoutEtiqueta(node.x, node.y, etiqueta, size / 2) : null;
                    return (
                      <g key={p.node}>
                        {(esOrigen || esDestino) && (
                          <rect x={node.x - size / 2 - 5} y={node.y - size / 2 - 5} width={size + 10} height={size + 10} rx={10}
                            fill="none" stroke={esOrigen ? "#10b981" : "#f43f5e"} strokeWidth={5} />
                        )}
                        <image href={iconoUrl(p.icon as string)} x={node.x - size / 2} y={node.y - size / 2} width={size} height={size} style={{ pointerEvents: "none" }} />
                        {layout && (
                          <text x={layout.x} y={layout.y} textAnchor={layout.align} dominantBaseline={svgBaseline[layout.baseline]}
                            fontSize={tamanoEtiqueta(escalaIconos)} fontWeight="bold" fontFamily="Arial, sans-serif"
                            fill="#111" stroke="rgba(255,255,255,0.9)" strokeWidth={3} paintOrder="stroke" style={{ pointerEvents: "none" }}>
                            {lineasNombre(p.name).map((linea, i, lineas) => (
                              <tspan key={i} x={layout.x} dy={`${(i === 0 ? desfaseLineas(layout.baseline, lineas.length) : 1) * INTERLINEADO}em`}>
                                {linea}
                              </tspan>
                            ))}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Origen/destino sin icono: un punto de color */}
                  {[from, to].filter(id => nivelDeNodo[id] === tramo.nivel && !poiPorId[id]?.icon).map(id => {
                    const n = nodoPorId[id];
                    return n ? <circle key={id} cx={n.x} cy={n.y} r={11} fill={id === from ? "#10b981" : "#f43f5e"} stroke="#fff" strokeWidth={4} /> : null;
                  })}

                  {/* Cambio de nivel: dónde se toma la escalera y por dónde se llega */}
                  {siguiente && fin && (
                    <EtiquetaCambio x={fin.x} y={fin.y} texto={`${Number(siguiente.nivel) > Number(tramo.nivel) ? "↑ Subí" : "↓ Bajá"} al Nivel ${siguiente.nivel}`} />
                  )}
                  {anterior && inicio && (
                    <EtiquetaCambio x={inicio.x} y={inicio.y} texto={`Llegás desde Nivel ${anterior.nivel}`} />
                  )}

                  {/* Flecha animada (la mueve el bucle de animación) */}
                  <g ref={el => { flechaRefs.current[i] = el; }} visibility="hidden" filter={`url(#sombra-${i})`}>
                    <polygon points="-16,-18 16,0 -16,18" fill="#4285F4" stroke="#fff" strokeWidth={3} />
                  </g>
                </svg>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Cartel sobre el punto donde se cambia de nivel */
function EtiquetaCambio({ x, y, texto }: { x: number; y: number; texto: string }) {
  const ancho = texto.length * 11 + 24;
  // Arriba del punto; si no entra, abajo
  const arriba = y > 70;
  const cy = arriba ? y - 46 : y + 46;
  const cx = Math.min(800 - ancho / 2 - 4, Math.max(ancho / 2 + 4, x));
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={cx - ancho / 2} y={cy - 17} width={ancho} height={34} rx={17} fill="#1d4ed8" stroke="#fff" strokeWidth={3} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight="bold" fontFamily="Arial, sans-serif" fill="#fff">
        {texto}
      </text>
    </g>
  );
}
