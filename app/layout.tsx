import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Auth } from "@/components/common/Auth/Auth";

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
          <Auth>
            {children}
          </Auth>
        </body>
    </html>
  );
}
