export const dynamic = "force-static";

const baseUrl = "https://www.ph1401.com";

const images = [
  ...Array.from({ length: 45 }, (_, index) => ({
    loc: `${baseUrl}/images/penthouse-${String(index + 1).padStart(2, "0")}.webp`,
    title: `Penthouse Playa Azul en Tonsupa · fotografía ${index + 1}`,
  })),
  ...Array.from({ length: 9 }, (_, index) => ({
    loc: `${baseUrl}/images/amenity-${String(index + 1).padStart(2, "0")}.webp`,
    title: `Amenidades de Playa Azul en Tonsupa · fotografía ${index + 1}`,
  })),
  { loc: `${baseUrl}/images/restaurant-01.webp`, title: "Restaurante de Playa Azul en Tonsupa" },
  { loc: `${baseUrl}/images/restaurant-02.webp`, title: "Restaurante frente al mar al atardecer" },
  { loc: `${baseUrl}/images/building-01.webp`, title: "Edificio Playa Azul frente al mar en Tonsupa" },
  { loc: `${baseUrl}/images/sports-01.webp`, title: "Canchas deportivas del complejo Playa Azul" },
];

export function GET() {
  const imageNodes = images
    .map(({ loc, title }) => `<image:image><image:loc>${loc}</image:loc><image:title>${title}</image:title></image:image>`)
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"><url><loc>${baseUrl}/</loc>${imageNodes}</url></urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
