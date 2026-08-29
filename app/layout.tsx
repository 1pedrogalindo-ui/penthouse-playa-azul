import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Penthouse Playa Azul | Vacaciones frente al mar en Tonsupa",
  description: "Penthouse dúplex de arriendo vacacional frente al mar en Tonsupa: 3 dormitorios, 3 baños, jacuzzi privado, piscina y acceso directo a la playa.",
  keywords: ["penthouse Tonsupa", "arriendo vacacional", "Playa Azul", "departamento frente al mar", "vacaciones Ecuador"],
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
