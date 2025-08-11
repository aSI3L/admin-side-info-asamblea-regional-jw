
import { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useGrafoMapaStore } from "@/zustand/grafo-mapa.store";
import { useEditMapEdificio } from "@/hooks/useEditMapEdificio";
import { loadMapGraph } from "@/services/map-graph.service";
import { Button } from "@/components/ui/button";

type ConnectStairsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (ids: string[]) => void;
};

export function ConnectStairsModal({ open, onOpenChange, onConnect }: ConnectStairsModalProps) {

  const { edificio } = useEditMapEdificio();
  const [stairsByLevel, setStairsByLevel] = useState<Record<string, { poi: any, nivel: string }[]>>({});
  const [selected, setSelected] = useState<string[]>([]);

  // Cargar escaleras/ascensores de todos los niveles al abrir el modal
  useEffect(() => {
    if (!open || !edificio?.id || !edificio.planos) return;
    const fetchAll = async () => {
      const result: Record<string, { poi: any, nivel: string }[]> = {};
      const entries = Object.entries(edificio.planos).filter(([nivel]) => typeof nivel === 'string' && nivel !== undefined && nivel !== '');
      for (const [nivel, url] of entries) {
  const data = await loadMapGraph({edificioId: edificio.id, nivel: nivel || ''});
        (data.pois || []).forEach((poi: any) => {
          if (/escalera|ascensor/i.test(poi.name)) {
            if (!result[nivel]) result[nivel] = [];
            result[nivel].push({ poi, nivel });
          }
        });
      }
      setStairsByLevel(result);
    };
    fetchAll();
  }, [open, edificio?.id, edificio?.planos]);

  const toggleSelect = (id: string) => {
    setSelected(sel => {
      if (sel.includes(id)) {
        return sel.filter(s => s !== id);
      } else {
        // Permitir seleccionar múltiples nodos de diferentes niveles
        return [...sel, id];
      }
    });
  };

  const handleConnect = () => {
    if (selected.length < 2) {
      alert("Selecciona al menos dos puntos para conectar");
      return;
    }
    onConnect(selected);
    setSelected([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Conectar escaleras/ascensores</DialogTitle>
          <div className="flex flex-col gap-2 my-4">
            {Object.keys(stairsByLevel).length === 0 && <div className="text-sm text-gray-500">No hay escaleras ni ascensores en ningún nivel.</div>}
            {Object.entries(stairsByLevel).map(([nivel, items]) => (
              <div key={nivel} className="mb-2">
                <div className="font-semibold text-xs mb-1">
                  Nivel {nivel} {edificio?.planos && edificio.planos[nivel] ? '' : '(sin nombre)'}
                </div>
                {items.map(({ poi }) => (
                  <Button
                    key={poi.node}
                    variant={selected.includes(poi.node) ? "default" : "outline"}
                    onClick={() => toggleSelect(poi.node)}
                    className={`w-full mb-1 ${selected.includes(poi.node) ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {poi.name} (x: {Math.round(poi.x)}, y: {Math.round(poi.y)})
                  </Button>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleConnect} disabled={selected.length < 2}>Conectar seleccionados</Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
