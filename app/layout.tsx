import type { Metadata } from "next";
import { Analytics } from "@/components/analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ph1401.com"),
  title: "Penthouse en Tonsupa frente al mar | Playa Azul",
  description:
    "Alquila un penthouse dúplex frente al mar en Playa Azul, Tonsupa: 3 dormitorios, 3 baños, jacuzzi privado, piscina, playa y reserva directa.",
  keywords: [
    "penthouse Tonsupa",
    "alquiler vacacional Tonsupa",
    "departamento frente al mar Tonsupa",
    "penthouse Playa Azul",
    "alojamiento en Tonsupa",
    "jacuzzi privado Tonsupa",
    "vacaciones en Esmeraldas",
  ],
  applicationName: "Penthouse Playa Azul",
  creator: "Penthouse Playa Azul",
  publisher: "Penthouse Playa Azul",
  category: "Alquiler vacacional",
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
    title: "Penthouse en Tonsupa frente al mar | Playa Azul",
    description:
      "Penthouse dúplex frente al mar en Tonsupa con jacuzzi privado, piscina, 3 dormitorios y acceso directo a la playa.",
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
    title: "Penthouse en Tonsupa frente al mar | Playa Azul",
    description:
      "Penthouse dúplex frente al mar en Tonsupa con jacuzzi privado, piscina y acceso directo a la playa.",
    images: ["/og-image.jpg"],
  },
  other: {
    "geo.region": "EC-E",
    "geo.placename": "Tonsupa, Esmeraldas",
    "geo.position": "0.901927;-79.799988",
    ICBM: "0.901927, -79.799988",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.ph1401.com/#website",
      url: "https://www.ph1401.com/",
      name: "Penthouse Playa Azul",
      description: "Alquiler vacacional frente al mar en Tonsupa, Ecuador.",
      inLanguage: ["es-EC", "en"],
    },
    {
      "@type": "VacationRental",
      "@id": "https://www.ph1401.com/#vacation-rental",
      name: "Penthouse Playa Azul",
      alternateName: "Penthouse frente al mar en Tonsupa",
      description:
        "Penthouse dúplex de alquiler vacacional frente al mar en Playa Azul, Tonsupa, con 3 dormitorios, 3 baños, jacuzzi privado, piscina y acceso directo a la playa.",
      url: "https://www.ph1401.com/",
      mainEntityOfPage: { "@id": "https://www.ph1401.com/#website" },
      image: [
        "https://www.ph1401.com/og-image.jpg",
        "https://www.ph1401.com/images/penthouse-44.webp",
        "https://www.ph1401.com/images/penthouse-33.webp",
        "https://www.ph1401.com/images/amenity-04.webp",
      ],
      telephone: "+593988335552",
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Edificio Deymar, Playa Azul",
        addressLocality: "Tonsupa",
        addressRegion: "Esmeraldas",
        addressCountry: "EC",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 0.901927,
        longitude: -79.799988,
      },
      numberOfRooms: 3,
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Jacuzzi privado", value: true },
        { "@type": "LocationFeatureSpecification", name: "Piscina frente al mar", value: true },
        { "@type": "LocationFeatureSpecification", name: "Acceso directo a la playa", value: true },
        { "@type": "LocationFeatureSpecification", name: "Aire acondicionado", value: true },
        { "@type": "LocationFeatureSpecification", name: "Restaurante en el complejo", value: true },
        { "@type": "LocationFeatureSpecification", name: "Canchas deportivas", value: true },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.ph1401.com/#preguntas-frecuentes",
      mainEntity: [
        ["¿Dónde está ubicado el Penthouse Playa Azul?", "Está en el Edificio Deymar, sector Playa Azul, Tonsupa, provincia de Esmeraldas, Ecuador, frente al océano Pacífico."],
        ["¿Cuántos dormitorios y baños tiene?", "El penthouse es un dúplex totalmente equipado con 3 dormitorios y 3 baños."],
        ["¿El jacuzzi es privado?", "Sí. El alojamiento tiene un jacuzzi privado en su terraza con vista al mar."],
        ["¿Qué amenidades incluye el complejo?", "Incluye piscina frente al mar, acceso directo y carpas en la playa, canchas deportivas, sala de ping-pong y restaurante."],
        ["¿Cómo consulto disponibilidad?", "Puedes consultar fechas, tarifa y número de huéspedes directamente por WhatsApp al +593 98 833 5552."],
      ].map(([name, text]) => ({
        "@type": "Question",
        name,
        acceptedAnswer: { "@type": "Answer", text },
      })),
    },
  ],
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
        <Analytics />
      </body>
    </html>
  );
}
