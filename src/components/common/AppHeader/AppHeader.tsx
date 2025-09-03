import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DropdownAvatar } from "./components/DropdownAvatar";
import { usePathname } from "next/navigation";
import { LINKS } from "@/consts/links.consts";

export function AppHeader() {
  const pathname = usePathname()
  const currentLink = LINKS.find(link => link.href === pathname)
  const currentHeaderPage = currentLink ? currentLink.label : "Inicio"
  return (
    <header className="flex h-16 items-center justify-between px-4 py-2 text-white sticky top-0 z-40 bg-primary md:rounded-t-xl">
        <div className="flex items-center gap-1">
            <SidebarTrigger />
            <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-base font-bold">{currentHeaderPage}</h1>
        </div>
        <DropdownAvatar />
    </header>
  );
}