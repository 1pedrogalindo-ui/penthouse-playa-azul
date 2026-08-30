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
  alternates: {
    canonical: "https://www.ph1401.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    title: "Penthouse Playa Azul | Vacaciones frente al mar en Tonsupa",
    description:
      "Penthouse dúplex de arriendo vacacional frente al mar en Tonsupa: 3 dormitorios, 3 baños, jacuzzi privado, piscina y acceso directo a la playa.",
    url: "https://www.ph1401.com",
    siteName: "Penthouse Playa Azul",
    images: [
      {
        url: "/og-image.jpg",
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
    images: ["/og-image.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "Penthouse Playa Azul",
  description:
    "Penthouse dúplex de arriendo vacacional frente al mar en Tonsupa: 3 dormitorios, 3 baños, jacuzzi privado, piscina y acceso directo a la playa.",
  url: "https://www.ph1401.com",
  image: "https://www.ph1401.com/og-image.jpg",
  telephone: "+593988335552",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tonsupa",
    addressRegion: "Esmeraldas",
    addressCountry: "EC",
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Jacuzzi privado", value: true },
    { "@type": "LocationFeatureSpecification", name: "Piscina", value: true },
    { "@type": "LocationFeatureSpecification", name: "Acceso directo a la playa", value: true },
    { "@type": "LocationFeatureSpecification", name: "Aire acondicionado", value: true },
    { "@type": "LocationFeatureSpecification", name: "Restaurante en el complejo", value: true },
  ],
  numberOfRooms: 3,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
