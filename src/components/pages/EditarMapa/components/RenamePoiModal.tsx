import { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function RenamePoiModal({ open, onOpenChange, initialName, onConfirm }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState(initialName || "");

  // Reset name when modal opens
  useEffect(() => {
    setName(initialName || "");
  }, [open, initialName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Nombrar punto de interés</DialogTitle>
          <input
            className="w-full border rounded px-2 py-1 mt-4 mb-2"
            placeholder="Ej: Escalera Este"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => { if (name.trim()) { onConfirm(name.trim()); onOpenChange(false); } }} disabled={!name.trim()}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
