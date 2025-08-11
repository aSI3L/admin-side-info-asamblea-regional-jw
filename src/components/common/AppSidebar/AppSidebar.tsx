"use client"

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { LINKS } from "@/consts/links.consts";
import Link from "next/link";
import { InfoCircle } from "./components/InfoCircleFill";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  return (
    <Sidebar variant="inset">
      <Button variant="ghost" onClick={toggleSidebar} className="absolute z-1 right-0.5 top-0.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary md:hidden">
        <X className="w-4 h-4" />
        <span className="sr-only">Cerrar menú</span>
      </Button>
      <SidebarHeader className="px-3 pt-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className="flex items-center gap-2">
              <InfoCircle className="w-6 h-6 md:w-7 md:h-7" />
              <span className="font-bold text-lg md:text-xl">Panel de Informes</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {
                LINKS.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={link.href}>
                          <link.icon />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}