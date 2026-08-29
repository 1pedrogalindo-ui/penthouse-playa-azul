"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, BedDouble, Check, ChevronRight, Expand, MapPin, Menu, MessageCircle, Snowflake, Sparkles, Users, Waves, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = "penthouse" | "amenities" | "restaurant" | "building";
type GalleryImage = { src: string; category: Category; es: string; en: string };

const penthouseLabels = [
  "Terraza privada frente al mar", "Jacuzzi privado", "Jacuzzi con vista", "Terraza posterior", "Terraza panorámica", "Área de servicio", "Jacuzzi y océano", "Balcón posterior",
  "Dormitorio familiar", "Baño completo", "Distribución dúplex", "Baño con ducha", "Escaleras interiores", "Dormitorio", "Dormitorio con vista", "Baño", "Sala de estar", "Escalera al segundo nivel", "Ducha", "Sala y entretenimiento", "Detalles del área social", "TV y aire acondicionado", "Comedor con vista al mar", "Sala", "Centro de entretenimiento", "Dormitorio principal", "Suite principal", "Vista directa a la playa", "Jacuzzi privado", "Terraza superior", "Dormitorio principal", "Área social panorámica",
];
const englishLabels = [
  "Private oceanfront terrace", "Private jacuzzi", "Jacuzzi with a view", "Rear terrace", "Panoramic terrace", "Service area", "Jacuzzi and ocean", "Rear balcony", "Family bedroom", "Full bathroom", "Duplex layout", "Bathroom with shower", "Interior stairs", "Bedroom", "Bedroom with a view", "Bathroom", "Living room", "Stairs to upper level", "Shower", "Living and entertainment area", "Social area details", "TV and air conditioning", "Ocean-view dining room", "Living room", "Entertainment center", "Main bedroom", "Main suite", "Direct beach view", "Private jacuzzi", "Upper terrace", "Main bedroom", "Panoramic social area",
];
const gallery: GalleryImage[] = [
  ...penthouseLabels.map((es, i) => ({ src: `/images/penthouse-${String(i + 1).padStart(2, "0")}.webp`, category: "penthouse" as const, es, en: englishLabels[i] })),
  { src: "/images/amenity-01.webp", category: "amenities", es: "Canchas del complejo", en: "Sports courts" },
  { src: "/images/amenity-02.webp", category: "amenities", es: "Balcón frente al mar", en: "Oceanfront balcony" },
  { src: "/images/amenity-03.webp", category: "amenities", es: "Piscina iluminada", en: "Night-lit pool" },
  { src: "/images/amenity-04.webp", category: "amenities", es: "Piscina y acceso a la playa", en: "Pool and beach access" },
  { src: "/images/amenity-05.webp", category: "amenities", es: "Atardecer en Playa Azul", en: "Sunset at Playa Azul" },
  { src: "/images/amenity-06.webp", category: "amenities", es: "Piscina frente al océano", en: "Oceanfront pool" },
  { src: "/images/amenity-07.webp", category: "building", es: "Arquitectura frente al mar", en: "Oceanfront architecture" },
  { src: "/images/amenity-08.webp", category: "amenities", es: "Sala de ping-pong", en: "Ping-pong room" },
  { src: "/images/amenity-09.webp", category: "building", es: "Playa Azul desde la arena", en: "Playa Azul from the shore" },
  { src: "/images/restaurant-01.webp", category: "restaurant", es: "Restaurante del complejo", en: "On-site restaurant" },
  { src: "/images/restaurant-02.webp", category: "restaurant", es: "Cena con puesta de sol", en: "Sunset dining" },
  { src: "/images/building-01.webp", category: "building", es: "Edificio Playa Azul", en: "Playa Azul building" },
  { src: "/images/sports-01.webp", category: "amenities", es: "Canchas multideportivas", en: "Multi-sport courts" },
];

const copy = {
  es: {
    nav: ["Experiencia", "Penthouse", "Amenidades", "Galería"], available: "Arriendo vacacional · Tonsupa, Ecuador", titleA: "Tu lugar frente", titleB: "al Pacífico.",
    intro: "Un penthouse dúplex donde el océano entra por cada ventana. Despierta con la vista, baja directo a la playa y termina el día en tu jacuzzi privado.", reserve: "Consultar disponibilidad", explore: "Vivir la experiencia", scroll: "Descubre el penthouse",
    storyKicker: "Playa Azul · frente al mar", storyTitle: "Aquí, las vacaciones empiezan antes de llegar.", storyText: "Espacios amplios, luz natural y una terraza privada suspendida sobre el océano. Todo está listo para que vengas con tu familia o amigos y te dediques únicamente a disfrutar.", featureTitle: "Un dúplex diseñado para disfrutar sin horarios",
    galleryKicker: "45 fotografías reales", galleryTitle: "Recorre cada espacio", galleryText: "Abre cualquier fotografía y navega la experiencia en pantalla completa.", tabs: ["Todo", "Penthouse", "Amenidades", "Restaurante", "Edificio"],
    amenitiesKicker: "Todo dentro del complejo", amenitiesTitle: "Más que hospedarte: vivir Playa Azul", restaurantTitle: "Atardeceres que también se saborean.", restaurantText: "El restaurante del complejo te permite disfrutar sin salir: una comida tranquila, el sonido del mar y el sol cayendo sobre el Pacífico.",
    finalKicker: "Tu próxima escapada", finalTitle: "El mar ya está listo. ¿Y tú?", finalText: "Escríbenos con tus fechas y número de huéspedes. Confirmaremos disponibilidad y tarifa directamente por WhatsApp.", quote: "Quiero consultar fechas", continue: "Sigue descubriendo", nextStops: ["La experiencia", "El penthouse", "Las amenidades", "El restaurante", "La galería", "Tu próxima escapada"],
  },
  en: {
    nav: ["Experience", "Penthouse", "Amenities", "Gallery"], available: "Vacation rental · Tonsupa, Ecuador", titleA: "Your place on", titleB: "the Pacific.",
    intro: "A duplex penthouse where the ocean fills every window. Wake up to the view, walk straight to the beach, and end the day in your private jacuzzi.", reserve: "Check availability", explore: "Live the experience", scroll: "Discover the penthouse",
    storyKicker: "Playa Azul · oceanfront", storyTitle: "Here, your vacation begins before you arrive.", storyText: "Open spaces, natural light and a private terrace suspended above the ocean. Everything is ready for you to arrive with family or friends and simply enjoy.", featureTitle: "A duplex designed for unhurried days",
    galleryKicker: "45 real photographs", galleryTitle: "Explore every space", galleryText: "Open any photograph and navigate the full-screen experience.", tabs: ["All", "Penthouse", "Amenities", "Restaurant", "Building"],
    amenitiesKicker: "Everything within the complex", amenitiesTitle: "More than a stay: experience Playa Azul", restaurantTitle: "Sunsets you can savor.", restaurantText: "The on-site restaurant lets you enjoy everything without leaving: a relaxed meal, the sound of the sea, and the sun setting over the Pacific.",
    finalKicker: "Your next escape", finalTitle: "The ocean is ready. Are you?", finalText: "Send us your dates and number of guests. We will confirm availability and rates directly on WhatsApp.", quote: "Check my dates", continue: "Keep exploring", nextStops: ["The experience", "The penthouse", "The amenities", "The restaurant", "The gallery", "Your next escape"],
  },
};
const whatsapp = "https://wa.me/593988335552?text=Hola%2C%20quiero%20consultar%20disponibilidad%20del%20Penthouse%20Playa%20Azul.%20Llegada%3A%20____%20Salida%3A%20____%20Hu%C3%A9spedes%3A%20____";

export default function Home() {
  const [lang, setLang] = useState<"es" | "en">("es");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [active, setActive] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const [journey, setJourney] = useState({ index: 0, progress: 0, visible: true });
  const t = copy[lang];
  const filtered = useMemo(() => category === "all" ? gallery : gallery.filter((item) => item.category === category), [category]);
  const current = active === null ? null : filtered[active];
  useEffect(() => {
    if (active === null) return;
    const handler = (event: KeyboardEvent) => { if (event.key === "ArrowRight") setActive((active + 1) % filtered.length); if (event.key === "ArrowLeft") setActive((active - 1 + filtered.length) % filtered.length); };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [active, filtered.length]);
  useEffect(() => {
    const stops = ["experiencia", "penthouse", "amenidades", "restaurante", "galeria", "contacto"];
    const updateJourney = () => {
      const viewportMark = window.scrollY + window.innerHeight * 0.58;
      const nextIndex = stops.findIndex((id) => {
        const element = document.getElementById(id);
        return element ? element.offsetTop > viewportMark : false;
      });
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setJourney({ index: nextIndex === -1 ? stops.length - 1 : nextIndex, progress: Math.min(1, window.scrollY / maxScroll), visible: nextIndex !== -1 && nextIndex < stops.length - 1 });
    };
    updateJourney();
    window.addEventListener("scroll", updateJourney, { passive: true });
    window.addEventListener("resize", updateJourney);
    return () => { window.removeEventListener("scroll", updateJourney); window.removeEventListener("resize", updateJourney); };
  }, []);
  const move = (direction: number) => setActive((value) => value === null ? 0 : (value + direction + filtered.length) % filtered.length);
  const journeyIds = ["experiencia", "penthouse", "amenidades", "restaurante", "galeria", "contacto"];

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Penthouse Playa Azul, inicio"><span className="brand-mark">PA</span><span>Penthouse <em>Playa Azul</em></span></a>
        <nav className={menu ? "nav open" : "nav"} aria-label="Navegación principal">{["experiencia", "penthouse", "amenidades", "galeria"].map((id, i) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>{t.nav[i]}</a>)}</nav>
        <div className="header-actions"><button className="lang" onClick={() => setLang(lang === "es" ? "en" : "es")} aria-label="Cambiar idioma">{lang === "es" ? "EN" : "ES"}</button><a className="nav-cta" href={whatsapp} target="_blank" rel="noreferrer">{t.reserve}<ChevronRight size={16}/></a><button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Abrir menú">{menu ? <X/> : <Menu/>}</button></div>
      </header>

      <section id="inicio" className="hero">
        <Image src="/images/amenity-06.webp" alt="Piscina frente al océano en Playa Azul" fill priority quality={95} sizes="100vw" className="hero-image" /><div className="hero-shade" />
        <div className="hero-content"><p className="eyebrow"><span />{t.available}</p><h1>{t.titleA}<br/><i>{t.titleB}</i></h1><p className="hero-intro">{t.intro}</p><div className="hero-buttons"><a className="button button-coral" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={19}/>{t.reserve}</a><a className="button button-glass" href="#experiencia">{t.explore}<ArrowDown size={18}/></a></div></div>
        <div className="hero-facts"><span><strong>3</strong> {lang === "es" ? "dormitorios" : "bedrooms"}</span><span><strong>3</strong> {lang === "es" ? "baños" : "bathrooms"}</span><span><strong>1</strong> jacuzzi {lang === "es" ? "privado" : "private"}</span><span><strong>∞</strong> {lang === "es" ? "vista al mar" : "ocean view"}</span></div>
        <a className="scroll-cue" href="#experiencia"><span>{t.scroll}</span><ArrowDown size={18}/></a>
      </section>

      <section id="experiencia" className="story section-pad">
        <div className="story-copy"><p className="kicker">{t.storyKicker}</p><h2>{t.storyTitle}</h2><p>{t.storyText}</p><div className="micro-features"><span><Waves/> {lang === "es" ? "Acceso directo a la playa" : "Direct beach access"}</span><span><Snowflake/> {lang === "es" ? "Aire acondicionado" : "Air conditioning"}</span><span><Users/> {lang === "es" ? "Ideal para familias y grupos" : "Perfect for families and groups"}</span></div></div>
        <button className="story-photo large" onClick={() => { setCategory("penthouse"); setActive(29); }} aria-label="Abrir fotografía de la terraza"><Image src="/images/penthouse-30.webp" alt="Terraza privada con jacuzzi y vista directa al océano" fill quality={94} sizes="(max-width: 800px) 100vw, 60vw" /><span><Expand/> {lang === "es" ? "Abrir vista" : "Open view"}</span></button>
        <div className="story-photo small"><Image src="/images/amenity-05.webp" alt="Atardecer sobre la playa" fill quality={92} sizes="(max-width: 800px) 50vw, 30vw" /></div>
      </section>

      <section id="penthouse" className="inside section-pad">
        <div className="inside-heading"><p className="kicker">{lang === "es" ? "Adentro se siente como casa" : "Inside feels like home"}</p><h2>{t.featureTitle}</h2></div>
        <div className="editorial-grid">
          <button className="editorial-photo tall" onClick={() => { setCategory("penthouse"); setActive(22); }}><Image src="/images/penthouse-23.webp" alt="Comedor con vista al océano" fill sizes="(max-width: 800px) 100vw, 45vw" /><span>{lang === "es" ? "Comedor panorámico" : "Panoramic dining"}</span></button>
          <div className="feature-card ocean"><BedDouble/><strong>3</strong><span>{lang === "es" ? "dormitorios para descansar de verdad" : "bedrooms made for real rest"}</span></div>
          <button className="editorial-photo" onClick={() => { setCategory("penthouse"); setActive(25); }}><Image src="/images/penthouse-26.webp" alt="Dormitorio principal" fill sizes="(max-width: 800px) 100vw, 30vw" /><span>{lang === "es" ? "Suite principal" : "Main suite"}</span></button>
          <div className="feature-card sand"><Sparkles/><strong>100%</strong><span>{lang === "es" ? "equipado para llegar y disfrutar" : "equipped—just arrive and enjoy"}</span></div>
          <button className="editorial-photo wide" onClick={() => { setCategory("penthouse"); setActive(16); }}><Image src="/images/penthouse-17.webp" alt="Sala del penthouse" fill sizes="(max-width: 800px) 100vw, 55vw" /><span>{lang === "es" ? "Sala amplia" : "Spacious lounge"}</span></button>
        </div>
      </section>

      <section id="amenidades" className="amenities section-pad">
        <div className="amenities-image"><Image src="/images/amenity-04.webp" alt="Piscina y playa de Playa Azul" fill quality={93} sizes="(max-width: 900px) 100vw, 55vw" /></div>
        <div className="amenities-copy"><p className="kicker light">{t.amenitiesKicker}</p><h2>{t.amenitiesTitle}</h2><div className="amenity-list">{[lang === "es" ? "Piscina frente al mar" : "Oceanfront pool", lang === "es" ? "Acceso directo y carpas en la playa" : "Direct beach access and sunshades", lang === "es" ? "Canchas de tenis, básquet, fútbol y vóley" : "Tennis, basketball, football and volleyball courts", lang === "es" ? "Sala de ping-pong" : "Ping-pong room", lang === "es" ? "Restaurante dentro del complejo" : "Restaurant within the complex"].map(item => <span key={item}><Check/>{item}</span>)}</div><a href="#galeria" className="text-link">{lang === "es" ? "Ver todas las amenidades" : "See all amenities"}<ArrowRight/></a></div>
      </section>

      <section id="restaurante" className="restaurant section-pad"><div className="restaurant-copy"><p className="kicker">{lang === "es" ? "Restaurante con vista" : "Restaurant with a view"}</p><h2>{t.restaurantTitle}</h2><p>{t.restaurantText}</p></div><button className="restaurant-photo" onClick={() => { setCategory("restaurant"); setActive(1); }}><Image src="/images/restaurant-02.webp" alt="Restaurante con vista al atardecer" fill sizes="(max-width: 800px) 100vw, 60vw" /><span><Expand/> {lang === "es" ? "Ver restaurante" : "View restaurant"}</span></button></section>

      <section id="galeria" className="gallery-section section-pad">
        <div className="gallery-heading"><div><p className="kicker">{t.galleryKicker}</p><h2>{t.galleryTitle}</h2></div><p>{t.galleryText}</p></div>
        <Tabs value={category} onValueChange={(value) => { setCategory(value as "all" | Category); setActive(null); }}><TabsList className="gallery-tabs">{(["all", "penthouse", "amenities", "restaurant", "building"] as const).map((value, i) => <TabsTrigger value={value} key={value}>{t.tabs[i]}</TabsTrigger>)}</TabsList></Tabs>
        <div className="photo-grid">{filtered.map((item, index) => <button className={`gallery-card ${index % 9 === 0 ? "featured" : ""}`} key={item.src} onClick={() => setActive(index)} aria-label={`${lang === "es" ? "Abrir" : "Open"} ${item[lang]}`}><Image src={item.src} alt={item[lang]} fill quality={88} sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw" /><span className="gallery-overlay"><b>{item[lang]}</b><Expand/></span></button>)}</div>
      </section>

      <section id="contacto" className="final-cta"><Image src="/images/amenity-05.webp" alt="Atardecer frente al océano" fill quality={94} sizes="100vw" /><div className="final-shade"/><div className="final-content"><p className="kicker light">{t.finalKicker}</p><h2>{t.finalTitle}</h2><p>{t.finalText}</p><a className="button button-coral" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle/>{t.quote}</a><small>WhatsApp · +593 98 833 5552</small></div></section>

      <footer><div className="footer-brand"><span className="brand-mark">PA</span><span><strong>Penthouse Playa Azul</strong><small><MapPin/> Tonsupa · Ecuador</small></span></div><div className="footer-links"><a href="#penthouse">Penthouse</a><a href="#amenidades">{t.nav[2]}</a><a href="#galeria">{t.nav[3]}</a></div><a className="footer-contact" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle/> +593 98 833 5552</a><p className="copyright">© 2026 Penthouse Playa Azul</p></footer>
      <a className="float-whatsapp" href={whatsapp} target="_blank" rel="noreferrer" aria-label="Consultar disponibilidad por WhatsApp"><MessageCircle/><span>{t.reserve}</span></a>
      <a className={`journey-guide ${journey.visible ? "visible" : ""}`} href={`#${journeyIds[journey.index]}`} aria-label={`${t.continue}: ${t.nextStops[journey.index]}`}>
        <span className="journey-progress" style={{ "--journey-progress": `${journey.progress * 360}deg` } as React.CSSProperties}><ArrowDown/></span>
        <span className="journey-copy"><small>{t.continue}</small><strong>{t.nextStops[journey.index]}</strong></span>
      </a>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}><DialogContent className="lightbox" showCloseButton={false}><DialogTitle className="sr-only">{current?.[lang] ?? "Galería"}</DialogTitle>{current && <div className="lightbox-image"><Image src={current.src} alt={current[lang]} fill quality={96} sizes="100vw" /></div>}<button className="lightbox-close" onClick={() => setActive(null)} aria-label="Cerrar"><X/></button><button className="lightbox-prev" onClick={() => move(-1)} aria-label="Anterior"><ArrowLeft/></button><button className="lightbox-next" onClick={() => move(1)} aria-label="Siguiente"><ArrowRight/></button><div className="lightbox-caption"><span>{current?.[lang]}</span><small>{active !== null ? active + 1 : 0} / {filtered.length}</small></div></DialogContent></Dialog>
    </main>
  );
}
