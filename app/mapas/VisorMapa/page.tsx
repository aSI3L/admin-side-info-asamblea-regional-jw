"use client";
import { useState, useEffect } from "react";
import { MapVisor } from "@/components/pages/VisorMapa/MapVisor";
import { loadMapLayers } from "@/services/map-graph.service";
import { edificiosService } from "@/services/index.generic.service";
import { Button } from "@/components/ui/button";

// Puedes cambiar estos valores por los que correspondan a tu base de datos
const edificioId = "edificio_demo";
const nivel = "0";
const capa = "Capa 1";

export default function VisorMapaPage() {
  const [edificios, setEdificios] = useState<{ id: string; nombre: string }[]>([]);
  const [edificioId, setEdificioId] = useState("");
  const [pois, setPois] = useState<{ node: string; name: string; nivel: string }[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showVisor, setShowVisor] = useState(false);

  // Cargar edificios al montar
  useEffect(() => {
    edificiosService.getAll().then((eds: any[] | null) => {
      if (!eds) return setEdificios([]);
      setEdificios(eds.map(e => ({ id: e.id, nombre: e.nombre })));
    });
  }, []);

  // Cargar todos los POIs de todos los niveles de la capa 1 al seleccionar edificio
  useEffect(() => {
    setPois([]); setFrom(""); setTo("");
    if (!edificioId) return;
    edificiosService.getById(edificioId).then(async (ed: any) => {
      const niveles = Object.keys(ed.planos || {});
      let allPois: { node: string; name: string; nivel: string }[] = [];
      for (const nivel of niveles) {
        const capasObj = await loadMapLayers({ edificioId, nivel });
        const data = capasObj["Capa 1"];
        if (data?.pois) {
          allPois = allPois.concat(data.pois.map((p: any) => ({ node: p.node, name: p.name, nivel })));
        }
      }
      setPois(allPois);
    });
  }, [edificioId]);

  const handleCalcular = (e: any) => {
    e.preventDefault();
    setShowVisor(true);
  };

  return (
    <div className="max-w-xl mx-auto bg-zinc-900 rounded-lg shadow p-6 mt-6 border border-zinc-700">
      <h2 className="text-2xl font-bold mb-4 text-white">Buscar ruta óptima (multi-nivel)</h2>
      <form onSubmit={handleCalcular} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold text-zinc-200">Edificio:</label>
          <select className="w-full border border-zinc-700 rounded p-2 bg-zinc-800 text-zinc-100" value={edificioId} onChange={e => setEdificioId(e.target.value)} required>
            <option value="">Seleccione un edificio</option>
            {edificios.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold text-zinc-200">Desde:</label>
          <select className="w-full border border-zinc-700 rounded p-2 bg-zinc-800 text-zinc-100" value={from} onChange={e => setFrom(e.target.value)} required>
            <option value="">Seleccione origen</option>
            {pois.map(p => <option key={p.node} value={p.node}>{p.name} [Nivel {p.nivel}]</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold text-zinc-200">Hasta:</label>
          <select className="w-full border border-zinc-700 rounded p-2 bg-zinc-800 text-zinc-100" value={to} onChange={e => setTo(e.target.value)} required>
            <option value="">Seleccione destino</option>
            {pois.map(p => <option key={p.node} value={p.node}>{p.name} [Nivel {p.nivel}]</option>)}
          </select>
        </div>
        <Button className="w-full bg-zinc-100 text-zinc-900 font-bold hover:bg-white" type="submit" disabled={!from || !to || !edificioId}>Calcular ruta</Button>
      </form>
      {showVisor && from && to && (
        <div className="mt-8">
          {/* Ajusta estos valores fijos para que la ruta se alinee con el plano */}
          <MapVisor edificioId={edificioId} nivel="" capa="Capa 1" from={from} to={to} scale={1} offsetX={0} offsetY={0} />
        </div>
      )}
    </div>
  );
}
