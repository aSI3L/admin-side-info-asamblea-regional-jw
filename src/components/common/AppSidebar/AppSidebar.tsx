"use client"

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { LINKS } from "@/consts/links.consts";
import Link from "next/link";
import { InfoCircle } from "./components/InfoCircleFill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { toggleSidebar } = useSidebar()
  return (
    <Sidebar variant="inset">
      <Button variant="ghost" onClick={toggleSidebar} className="absolute z-1 right-0.5 top-0.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary md:hidden">
        <X className="w-4 h-4" />
        <span className="sr-only">Cerrar menú</span>
      </Button>
      <SidebarHeader className="px-5 pt-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className="flex items-center gap-2">
              <Avatar className="w-6 h-6 md:w-7 md:h-7">
                <AvatarFallback>
                  <InfoCircle className="w-full h-full" />
                </AvatarFallback>
              </Avatar>
              <span className="font-bold text-md md:text-lg">Panel de Informes</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {
                LINKS.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild>
                      <Link href={link.href}>
                        <link.icon />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}