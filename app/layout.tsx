import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/src/components/ui/sidebar";
import { AppSidebar } from "@/src/components/common/Navbar/AppSidebar";

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
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <SidebarProvider>
            <aside>
              <AppSidebar />
            </aside>
            <main className="grid min-h-screen md:grid-cols-[200px_1fr] lg:grid-cols-[300px_1fr]">
              <header className="md:hidden">
                <SidebarTrigger />
              </header>
              {children}
            </main>
          </SidebarProvider>
        </body>
    </html>
  );
}
