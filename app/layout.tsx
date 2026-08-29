import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ph1401.com"),
  title: "Penthouse Playa Azul | Vacaciones frente al mar en Tonsupa",
  description:
    "Penthouse dúplex de arriendo vacacional frente al mar en Tonsupa: 3 dormitorios, 3 baños, jacuzzi privado, piscina y acceso directo a la playa.",
  keywords: [
    "penthouse Tonsupa",
    "arriendo vacacional",
    "Playa Azul",
    "departamento frente al mar",
    "vacaciones Ecuador",
  ],
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Penthouse Playa Azul | Vacaciones frente al mar en Tonsupa",
    description:
      "Penthouse dúplex de arriendo vacacional frente al mar en Tonsupa: 3 dormitorios, 3 baños, jacuzzi privado, piscina y acceso directo a la playa.",
    url: "https://www.ph1401.com",
    siteName: "Penthouse Playa Azul",
    images: [
      {
        url: "/images/penthouse-01.webp",
        width: 1200,
        height: 630,
        alt: "Penthouse Playa Azul - Vista frente al mar",
      },
    ],
    locale: "es_EC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Penthouse Playa Azul | Vacaciones frente al mar en Tonsupa",
    description:
      "Penthouse dúplex de arriendo vacacional frente al mar en Tonsupa: 3 dormitorios, 3 baños, jacuzzi privado, piscina y acceso directo a la playa.",
    images: ["/images/penthouse-01.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
