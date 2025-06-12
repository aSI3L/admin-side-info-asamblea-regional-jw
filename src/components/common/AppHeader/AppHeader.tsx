import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DropdownAvatar } from "./components/DropdownAvatar";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between px-4 py-2 text-white sticky top-0 z-10">
        <div className="flex items-center gap-1">
            <SidebarTrigger />
            <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-base font-bold">Inicio</h1>
        </div>
        <DropdownAvatar />
    </header>
  );
}