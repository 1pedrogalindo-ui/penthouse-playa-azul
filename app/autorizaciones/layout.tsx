import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autorizaciones de ingreso | Penthouse 1401",
  description: "Herramienta privada para generar autorizaciones de ingreso.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function AuthorizationsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
