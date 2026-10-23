import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://autorizaciones.ph1401.com"),
  title: {
    default: "DEYMAR | Autorizaciones de ingreso",
    template: "%s | DEYMAR",
  },
  description:
    "Portal privado de DEYMAR para generar autorizaciones de ingreso del Penthouse 1401.",
  applicationName: "DEYMAR · Autorizaciones",
  creator: "DEYMAR",
  publisher: "DEYMAR",
  alternates: {
    canonical: "https://autorizaciones.ph1401.com/autorizaciones/acceso/",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    title: "DEYMAR | Autorizaciones de ingreso",
    description:
      "Portal privado para generar autorizaciones de ingreso del Penthouse 1401.",
    url: "https://autorizaciones.ph1401.com/autorizaciones/acceso/",
    siteName: "DEYMAR",
    locale: "es_EC",
    type: "website",
  },
};

export default function AuthorizationsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
