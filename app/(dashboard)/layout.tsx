"use client"

import "../globals.css";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/AppSidebar/AppSidebar";
import { AppHeader } from "@/components/common/AppHeader/AppHeader";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
        <Toaster richColors />
        <AppSidebar />
        <SidebarInset>
            <AppHeader />
            {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
