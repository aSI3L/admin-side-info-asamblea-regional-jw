import { Geist, Geist_Mono, Roboto } from "next/font/google";
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

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} antialiased m-0`}>
        <Auth>
          {children}
        </Auth>
      </body>
    </html>
  );
}
