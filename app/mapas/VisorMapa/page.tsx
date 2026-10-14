"use client";
import { useState, useEffect, useRef } from "react";
import { MapVisor } from "@/components/pages/VisorMapa/MapVisor";
import { loadMapLayers } from "@/services/map-graph.service";
import { edificiosService } from "@/services/index.generic.service";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  Building,
  ArrowLeft,
  Check,
  ArrowRight
} from "lucide-react";
import { iconoUrl } from "@/consts/iconos.consts";

type PoiVisor = { node: string; name: string; nivel: string; icon?: string };

export default function VisorMapaPage() {
  const [edificios, setEdificios] = useState<{ id: string; nombre: string }[]>([]);
  const [edificioId, setEdificioId] = useState("");
  const [edificioNombre, setEdificioNombre] = useState("");
  const [pois, setPois] = useState<PoiVisor[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showVisor, setShowVisor] = useState(false);

  // Estados de interfaz móvil
  const [instructions, setInstructions] = useState<string[]>([]);
  // Panel de origen/destino: se pliega solo al elegir la ruta, para dejar lugar a los croquis
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);
  const [searchField, setSearchField] = useState<"from" | "to" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar edificios al montar
  useEffect(() => {
    edificiosService.getAll().then((eds: any[] | null) => {
      if (!eds) return setEdificios([]);
      setEdificios(eds.map(e => ({ id: e.id, nombre: e.nombre })));
    });
  }, []);

  // Cargar todos los POIs del edificio seleccionado
  useEffect(() => {
    setPois([]);
    setFrom("");
    setTo("");
    setInstructions([]);
    setShowVisor(false);
    if (!edificioId) return;

    const selectedEd = edificios.find(e => e.id === edificioId);
    if (selectedEd) setEdificioNombre(selectedEd.nombre);

    edificiosService.getById(edificioId).then(async (ed: any) => {
      if (!ed) return;
      const niveles = Object.keys(ed.planos || {}).sort((a, b) => Number(a) - Number(b));
      let allPois: PoiVisor[] = [];
      for (const nivel of niveles) {
        const capasObj = await loadMapLayers({ edificioId, nivel });
        const data = capasObj["Capa 1"];
        if (data?.pois) {
          allPois = allPois.concat(data.pois.map((p: any) => ({ node: p.node, name: p.name, nivel, icon: p.icon })));
        }
      }
      setPois(allPois);
    });
  }, [edificioId, edificios]);

  // Intercambiar origen y destino
  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  // Limpiar campos de ruta
  const handleClearRoute = () => {
    setFrom("");
    setTo("");
    setInstructions([]);
    setShowVisor(false);
  };

  // Buscar POIs filtrados, agrupados por nivel y ordenados por nombre dentro de cada nivel
  const filteredPois = pois.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const poisPorNivel = Array.from(new Set(filteredPois.map(p => p.nivel)))
    .sort((a, b) => Number(a) - Number(b))
    .map(nivel => ({
      nivel,
      pois: filteredPois
        .filter(p => p.nivel === nivel)
        .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    }));

  const getPoiName = (nodeId: string) => {
    return pois.find(p => p.node === nodeId)?.name ?? "";
  };

  // Seleccionar POI en el buscador
  const handleSelectPoi = (nodeId: string) => {
    if (searchField === "from") {
      setFrom(nodeId);
    } else if (searchField === "to") {
      setTo(nodeId);
    }
    setSearchField(null);
    setSearchQuery("");
  };

  // Calcular la ruta óptima
  useEffect(() => {
    if (from && to && edificioId) {
      setShowVisor(true);
      setPanelAbierto(false);
    } else {
      setPanelAbierto(true);
    }
  }, [from, to, edificioId]);

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-zinc-950 flex flex-col text-zinc-100 font-sans">
      {/* PANTALLA DE SELECCIÓN DE EDIFICIO (Si no hay seleccionado) */}
      {!edificioId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 z-40">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto">
              <Building className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Seleccionar Edificio</h2>
              <p className="text-sm text-zinc-400">
                Selecciona un edificio para ver su mapa e indicaciones interactivas.
              </p>
            </div>
            <div className="space-y-2">
              {edificios.length > 0 ? (
                edificios.map(e => (
                  <button
                    key={e.id}
                    onClick={() => setEdificioId(e.id)}
                    className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] transition-all font-semibold rounded-xl text-left flex items-center justify-between border border-zinc-700/50"
                  >
                    <span>{e.nombre}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-400 rotate-270" />
                  </button>
                ))
              ) : (
                <div className="text-zinc-400 py-4 text-sm">Cargando edificios...</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* PANTALLA PRINCIPAL DEL VISOR: panel de ruta arriba, croquis en el medio, indicaciones abajo */
        <div className="flex-1 min-h-0 w-full flex flex-col">
          {/* Panel de origen y destino (se pliega para dejar lugar a los croquis) */}
          <div className="shrink-0 px-3 pt-3 pb-2 z-30">
            <div className="max-w-md mx-auto bg-zinc-900/95 backdrop-blur-md border border-zinc-800/80 shadow-2xl rounded-2xl">
              {panelAbierto ? (
                <div className="p-4 flex flex-col gap-3">
                  {/* Botón para volver a seleccionar edificio */}
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-sm text-zinc-300">{edificioNombre}</span>
                    </div>
                    <button
                      onClick={() => setEdificioId("")}
                      className="text-xs text-blue-400 hover:underline active:scale-95 transition-transform"
                    >
                      Cambiar Edificio
                    </button>
                  </div>

                  {/* Controles de origen y destino */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex flex-col gap-2 relative">
                      {/* Línea conectora */}
                      <div className="absolute left-[11px] top-6 bottom-6 w-[2px] bg-zinc-700" />

                      <button
                        onClick={() => {
                          setSearchField("from");
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 w-full text-left bg-zinc-850 hover:bg-zinc-800 active:bg-zinc-800/80 px-3 py-2.5 rounded-xl border border-zinc-700/50 text-sm transition-all"
                      >
                        <div className="w-6 h-6 rounded-full bg-zinc-750 flex items-center justify-center text-zinc-400 shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="truncate flex-1">
                          {from ? getPoiName(from) : "Seleccionar punto de partida"}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setSearchField("to");
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 w-full text-left bg-zinc-850 hover:bg-zinc-800 active:bg-zinc-800/80 px-3 py-2.5 rounded-xl border border-zinc-700/50 text-sm transition-all"
                      >
                        <div className="w-6 h-6 rounded-full bg-zinc-750 flex items-center justify-center text-zinc-400 shrink-0">
                          <MapPin className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="truncate flex-1">
                          {to ? getPoiName(to) : "Buscar destino..."}
                        </span>
                      </button>
                    </div>

                    {/* Botón de Swap */}
                    <button
                      onClick={handleSwap}
                      aria-label="Intercambiar origen y destino"
                      className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-90 flex items-center justify-center text-zinc-300 border border-zinc-700/60 transition-all"
                    >
                      <ArrowUpDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Limpiar ruta y plegar el panel */}
                  {(from || to) && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearRoute}
                        className="flex-1 py-2 bg-zinc-800/50 hover:bg-zinc-800 active:scale-98 border border-zinc-850 rounded-xl text-xs font-semibold text-zinc-300 transition-all flex items-center justify-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        Limpiar ruta
                      </button>
                      {showVisor && (
                        <button
                          onClick={() => setPanelAbierto(false)}
                          className="flex-1 py-2 bg-zinc-800/50 hover:bg-zinc-800 active:scale-98 border border-zinc-850 rounded-xl text-xs font-semibold text-zinc-300 transition-all flex items-center justify-center gap-1.5"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          Ver mapa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Panel plegado: resumen de la ruta; un toque lo vuelve a abrir
                <button
                  onClick={() => setPanelAbierto(true)}
                  className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-sm"
                  aria-label="Mostrar origen y destino"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate min-w-0 flex-1">{getPoiName(from)}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate min-w-0 flex-1">{getPoiName(to)}</span>
                  <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>
              )}
            </div>
          </div>

          {/* Croquis de los niveles de la ruta */}
          <div className="flex-1 min-h-0 w-full">
            {showVisor && from && to ? (
              <MapVisor
                edificioId={edificioId}
                capa="Capa 1"
                from={from}
                to={to}
                onInstructionsChange={setInstructions}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-950 p-6 text-center">
                <Navigation className="w-12 h-12 text-zinc-600 mb-3 animate-pulse" />
                <p className="text-base font-semibold">Configura tu ruta en el panel superior</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-[250px]">
                  Elige un punto de partida y un destino para visualizar el camino interactivo.
                </p>
              </div>
            )}
          </div>

          {/* Indicaciones (plegable) */}
          {showVisor && instructions.length > 0 && (
            <div
              className={`shrink-0 w-full max-w-md mx-auto bg-zinc-900 border-t border-zinc-800 rounded-t-3xl shadow-2xl z-30 transition-all duration-300 ${
                isBottomSheetOpen ? "max-h-[40vh] overflow-y-auto" : "max-h-[58px] overflow-hidden"
              }`}
            >
              {/* Barra de arrastre táctil / Toggle */}
              <div
                onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)}
                className="py-3 cursor-pointer flex flex-col items-center gap-1 bg-zinc-900 select-none sticky top-0"
              >
                <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
                <div className="w-full px-5 flex items-center justify-between text-xs text-zinc-400 mt-1">
                  <span className="font-semibold text-zinc-200">
                    Instrucciones de ruta
                  </span>
                  <div className="flex items-center gap-1">
                    <span>{isBottomSheetOpen ? "Colapsar" : "Expandir"}</span>
                    {isBottomSheetOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Lista de indicaciones */}
              <div className="px-5 pb-6 pt-2 space-y-4">
                <div className="flex flex-col divide-y divide-zinc-800">
                  {instructions.map((step, idx) => (
                    <div key={idx} className="py-3 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600/10 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-zinc-300 font-medium leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BUSCADOR DE POIS FULLSCREEN OVERLAY */}
          {searchField && (
            <div className="fixed inset-0 bg-zinc-950/98 backdrop-blur-lg z-50 flex flex-col p-4">
              {/* Cabecera del buscador */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => {
                    setSearchField(null);
                    setSearchQuery("");
                  }}
                  className="w-10 h-10 rounded-full hover:bg-zinc-850 active:scale-95 flex items-center justify-center text-zinc-400 transition-all shrink-0"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder={
                      searchField === "from"
                        ? "Buscar punto de origen..."
                        : "Buscar destino..."
                    }
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Lista de resultados */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {poisPorNivel.length > 0 ? (
                    poisPorNivel.map(grupo => (
                      <section key={grupo.nivel} className="space-y-1">
                        <h3 className="sticky top-0 z-10 bg-zinc-950 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Nivel {grupo.nivel}
                        </h3>
                        {grupo.pois.map(p => {
                          const isSelected =
                            searchField === "from" ? from === p.node : to === p.node;
                          return (
                            <button
                              key={p.node}
                              onClick={() => handleSelectPoi(p.node)}
                              className={`w-full py-3 px-4 rounded-2xl flex items-center justify-between active:scale-[0.99] transition-all text-left ${
                                isSelected
                                  ? "bg-blue-600/10 border border-blue-500/50"
                                  : "hover:bg-zinc-900 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {p.icon ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={iconoUrl(p.icon)} alt="" className="w-8 h-8 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
                                    <MapPin
                                      className={`w-4 h-4 ${
                                        isSelected ? "text-blue-500" : "text-zinc-500"
                                      }`}
                                    />
                                  </div>
                                )}
                                <p className="font-semibold text-zinc-200 text-sm">
                                  {p.name}
                                </p>
                              </div>
                              {isSelected && <Check className="w-5 h-5 text-blue-500" />}
                            </button>
                          );
                        })}
                      </section>
                    ))
                  ) : (
                    <div className="text-center py-10 text-zinc-400 text-sm">
                      No se encontraron ubicaciones
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
