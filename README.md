# Penthouse Playa Azul

Landing inmersiva para el Penthouse Playa Azul en Tonsupa, Ecuador. Desarrollada con Next.js, TypeScript y una galería responsive de 45 fotografías reales.

## Desarrollo local

```bash
npm install
npm run dev
```

El despliegue a GitHub Pages se ejecuta automáticamente al actualizar la rama `main`.

## Analítica y conversiones

La landing integra Google Analytics 4 y Meta Pixel con consentimiento previo. Configura estas variables en Vercel (Production, Preview y Development si corresponde):

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=000000000000000
```

Después de guardarlas, vuelve a desplegar el proyecto. Se registran visitas, profundidad de scroll, aperturas y filtros de galería, cambio de idioma y clics de WhatsApp como leads.
