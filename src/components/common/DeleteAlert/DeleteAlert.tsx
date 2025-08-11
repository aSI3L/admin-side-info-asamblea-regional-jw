import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { OctagonAlert, Trash2 } from "lucide-react";

interface DeleteAlertProps {
    deleteUsuarioAutorizado: (id: string) => Promise<boolean>;
    userId: string;
    cnBtnTrigger?: string;
}

export default function DeleteAlert({ deleteUsuarioAutorizado, userId, cnBtnTrigger}: DeleteAlertProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          className={`cursor-pointer text-white border-white hover:bg-red-800 ${cnBtnTrigger || ""}`} 
          style={{ backgroundColor: '#8e0000' }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle>
            <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <OctagonAlert className="h-7 w-7 text-destructive" />
            </div>
            Está seguro de querer eliminar este item?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] text-center text-white">
            Esta acción no se puede deshacer. Asegúrese de que desea eliminar este item permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 sm:justify-center">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white border-white"
            style={{ backgroundColor: '#8e0000' }}
            onClick={() => deleteUsuarioAutorizado(userId)}
          >
            Si, eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
