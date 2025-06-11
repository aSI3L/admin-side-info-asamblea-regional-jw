import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarInset, SidebarProvider } from "@/ui/sidebar";
import { AppSidebar } from "@/components/common/AppSidebar/AppSidebar";
import { AppHeader } from "@/components/common/AppHeader/AppHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased m-0`}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <main className="flex flex-col">
                <AppHeader />
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </body>
    </html>
  );
}
