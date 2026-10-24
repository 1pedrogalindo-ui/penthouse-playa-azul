"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Info, MessageCircle } from "lucide-react";
import { trackEvent } from "@/components/analytics";

type Language = "es" | "en";
type Season = "low" | "mid" | "high";
type Unavailable = { check_in: string; check_out: string; status: "pending" | "confirmed" | "blocked" };
type DayRate = { date: string; season: Season; price: number };

const RATES: Record<Season, number> = { low: 180, mid: 200, high: 230 };
const CLEANING_FEE = 25;
const BRACELET_FEE = 5;
const DAY_MS = 86_400_000;

const copy = {
  es: {
    kicker: "Reserva directa · disponibilidad real", title: "Reserva tu estadía frente al mar",
    intro: "Selecciona entrada y salida en el calendario. El presupuesto se actualiza noche por noche según la temporada.",
    stay: "Tu alojamiento", dates: "Tus fechas", property: "Penthouse dúplex PH 1401", base: "Desde", perNight: "por noche",
    capacity: "Hasta 10 huéspedes · 1 unidad", selected: "Seleccionado", calendarHelp: "Selecciona entrada y salida · precios por noche",
    available: "Disponible", reserved: "Reservada", blocked: "Bloqueada", low: "Temporada baja", mid: "Media", high: "Alta / feriado",
    clear: "Borrar fechas", checkIn: "Entrada", checkOut: "Salida", nights: "Noches", budget: "Presupuesto de alojamiento",
    nightly: "Precio de cada noche", lodging: "Subtotal de alojamiento", cleaning: "Limpieza (una vez por estancia)", total: "Total alojamiento + limpieza",
    checkoutNote: "El día de salida no se cobra como noche.", braceletTitle: "Brazaletes de ingreso · cargo externo",
    braceletText: "La administración del edificio cobra $5,00 por cada huésped mayor de 7 años. Se paga directamente al ingresar y no está incluido en el total.",
    request: "Solicita tu reserva", name: "Nombre y apellido", email: "Correo electrónico", phone: "WhatsApp",
    guests: "Número total de huéspedes", older: "Mayores de 7 años", olderHelp: "Dato para estimar los brazaletes que se pagan a la administración del edificio.",
    comments: "Comentarios (opcional)", consent: "Autorizo el uso de estos datos únicamente para gestionar mi solicitud y contactarme. Enviar la solicitud no confirma la reserva ni realiza un cobro.",
    submit: "Solicitar reserva", sending: "Enviando…", select: "Elige las fechas para ver el presupuesto.",
    invalid: "Selecciona una fecha de salida posterior a la entrada.", unavailableRange: "El rango incluye una fecha reservada o bloqueada.",
    sent: "Solicitud registrada. Abriremos WhatsApp para continuar.", before: "Antes de reservar", external: "Estimado informativo",
  },
  en: {
    kicker: "Direct booking · live availability", title: "Book your oceanfront stay",
    intro: "Choose check-in and check-out on the calendar. Your quote updates night by night according to the season.",
    stay: "Your accommodation", dates: "Your dates", property: "PH 1401 duplex penthouse", base: "From", perNight: "per night",
    capacity: "Up to 10 guests · 1 unit", selected: "Selected", calendarHelp: "Select check-in and check-out · nightly prices",
    available: "Available", reserved: "Reserved", blocked: "Blocked", low: "Low season", mid: "Mid season", high: "High / holiday",
    clear: "Clear dates", checkIn: "Check-in", checkOut: "Check-out", nights: "Nights", budget: "Accommodation quote",
    nightly: "Night-by-night price", lodging: "Accommodation subtotal", cleaning: "Cleaning (once per stay)", total: "Accommodation + cleaning total",
    checkoutNote: "Check-out day is not charged as a night.", braceletTitle: "Entry wristbands · external charge",
    braceletText: "Building management charges $5.00 for each guest over 7. It is paid directly on arrival and is not included in this total.",
    request: "Request your booking", name: "Full name", email: "Email", phone: "WhatsApp",
    guests: "Total guests", older: "Guests over 7", olderHelp: "Used to estimate wristbands paid directly to building management.",
    comments: "Comments (optional)", consent: "I authorize use of this data only to process my request and contact me. Sending the request does not confirm a booking or make a charge.",
    submit: "Request booking", sending: "Sending…", select: "Choose dates to see your quote.",
    invalid: "Choose a check-out date after check-in.", unavailableRange: "This range includes a reserved or blocked date.",
    sent: "Request saved. We will open WhatsApp to continue.", before: "Before booking", external: "Informational estimate",
  },
} as const;

function iso(date: Date) { return date.toISOString().slice(0, 10); }
function parseDate(value: string) { return new Date(`${value}T00:00:00Z`); }
function addDays(date: Date, days: number) { return new Date(date.getTime() + days * DAY_MS); }
function money(value: number, language: Language) { return new Intl.NumberFormat(language === "es" ? "es-EC" : "en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value); }
function fullDate(value: string, language: Language) { return value ? new Intl.DateTimeFormat(language === "es" ? "es-EC" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parseDate(value)) : "—"; }
function shortDate(value: string, language: Language) { return new Intl.DateTimeFormat(language === "es" ? "es-EC" : "en-US", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(parseDate(value)); }
function rateFor(value: string): DayRate {
  const date = parseDate(value); const month = date.getUTCMonth() + 1; const day = date.getUTCDate(); const weekday = date.getUTCDay();
  const peak = (month === 12 && day >= 20) || (month === 1 && day <= 5);
  const season: Season = peak ? "high" : ([6, 7, 8].includes(month) || weekday === 5 || weekday === 6) ? "mid" : "low";
  return { date: value, season, price: RATES[season] };
}

export function BookingCalculator({ language }: { language: Language }) {
  const t = copy[language]; const today = iso(new Date());
  const [month, setMonth] = useState(() => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)));
  const [unavailable, setUnavailable] = useState<Unavailable[]>([]);
  const [checkIn, setCheckIn] = useState(""); const [checkOut, setCheckOut] = useState("");
  const rangeRef = useRef({ checkIn: "", checkOut: "" });
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(2); const [olderGuests, setOlderGuests] = useState(2); const [comments, setComments] = useState("");
  const [consent, setConsent] = useState(false); const [error, setError] = useState(""); const [status, setStatus] = useState(""); const [sending, setSending] = useState(false);
  useEffect(() => { fetch("/api/reservations", { cache: "no-store" }).then((r) => r.json()).then((x) => setUnavailable(x.unavailable || [])).catch(() => setUnavailable([])); }, []);
  const statusFor = (date: string) => { const match = unavailable.find((item) => date >= item.check_in && date < item.check_out); return match ? (match.status === "blocked" ? "blocked" : "reserved") : "available"; };
  const monthDays = useMemo(() => { const mondayOffset = (month.getUTCDay() + 6) % 7; const start = addDays(month, -mondayOffset); return Array.from({ length: 42 }, (_, index) => addDays(start, index)); }, [month]);
  const daily = useMemo<DayRate[]>(() => { if (!checkIn || !checkOut || checkOut <= checkIn) return []; const result: DayRate[] = []; for (let cursor = parseDate(checkIn); iso(cursor) < checkOut; cursor = addDays(cursor, 1)) result.push(rateFor(iso(cursor))); return result; }, [checkIn, checkOut]);
  const lodging = daily.reduce((sum, item) => sum + item.price, 0); const total = daily.length ? lodging + CLEANING_FEE : 0; const braceletEstimate = olderGuests * BRACELET_FEE;
  function updateRange(nextCheckIn: string, nextCheckOut: string) {
    rangeRef.current = { checkIn: nextCheckIn, checkOut: nextCheckOut };
    setCheckIn(nextCheckIn); setCheckOut(nextCheckOut);
  }
  function chooseDate(value: string) {
    if (value < today || statusFor(value) !== "available") return; setError(""); setStatus("");
    const current = rangeRef.current;
    if (!current.checkIn || current.checkOut || value <= current.checkIn) { updateRange(value, ""); return; }
    for (let cursor = parseDate(current.checkIn); iso(cursor) < value; cursor = addDays(cursor, 1)) if (statusFor(iso(cursor)) !== "available") { setError(t.unavailableRange); return; }
    updateRange(current.checkIn, value);
  }
  function clearDates() { updateRange("", ""); setError(""); setStatus(""); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!daily.length) { setError(t.invalid); return; } setSending(true); setError(""); setStatus("");
    const seasons = [...new Set(daily.map((item) => item.season))]; const averageRate = lodging / daily.length;
    const payload = { guest_name: name, phone, email, check_in: checkIn, check_out: checkOut, guests, guests_over_7: olderGuests, season: seasons.length === 1 ? seasons[0] : "mixed", nightly_rate: Number(averageRate.toFixed(2)), lodging_subtotal: lodging, cleaning_fee: CLEANING_FEE, bracelet_estimate: braceletEstimate, total, comments, rate_breakdown: daily };
    const response = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); setSending(false);
    if (!response.ok) { setError(result.error || "No pudimos registrar la solicitud."); return; } setStatus(t.sent);
    const message = language === "es" ? `Hola, quiero solicitar una reserva del Penthouse PH 1401.\n\nEntrada: ${fullDate(checkIn, language)}\nSalida: ${fullDate(checkOut, language)}\nHuéspedes: ${guests}\nNoches: ${daily.length}\nAlojamiento: ${money(lodging, language)}\nLimpieza: ${money(CLEANING_FEE, language)}\nTotal: ${money(total, language)}\nBrazaletes externos estimados: ${money(braceletEstimate, language)}\n\nPor favor, confírmame la reserva.` : `Hello, I would like to request a booking for PH 1401.\n\nCheck-in: ${fullDate(checkIn, language)}\nCheck-out: ${fullDate(checkOut, language)}\nGuests: ${guests}\nNights: ${daily.length}\nAccommodation: ${money(lodging, language)}\nCleaning: ${money(CLEANING_FEE, language)}\nTotal: ${money(total, language)}\nEstimated external wristbands: ${money(braceletEstimate, language)}\n\nPlease confirm my booking.`;
    trackEvent("generate_lead", { lead_source: "booking_calendar", language, nights: daily.length, guests, estimated_total: total }, "Lead"); window.open(`https://wa.me/593988335552?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }
  const monthLabel = new Intl.DateTimeFormat(language === "es" ? "es-EC" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(month);
  const weekdays = language === "es" ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return <section id="reservar" className="booking-section section-pad">
    <div className="booking-heading"><div><p className="kicker">{t.kicker}</p><h2>{t.title}</h2></div><p>{t.intro}</p></div>
    <div className="property-step"><p>1 · {t.stay}</p><article className="property-card"><div className="property-photo"/><div><h3>{t.property}</h3><span>{t.base} <strong>{money(180, language)}</strong> {t.perNight}</span><p>{t.capacity}</p></div><b><Check/> {t.selected}</b></article></div>
    <div className="reservation-grid"><div className="calendar-column"><p className="booking-step">2 · {t.dates}</p><div className="booking-calendar">
      <header><button type="button" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))} aria-label="Mes anterior"><ChevronLeft/></button><strong>{monthLabel}</strong><button type="button" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))} aria-label="Mes siguiente"><ChevronRight/></button></header>
      <p>{t.calendarHelp}</p><div className="weekday-row">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="month-grid">{monthDays.map((date) => { const value = iso(date); const rate = rateFor(value); const availability = statusFor(value); const outside = date.getUTCMonth() !== month.getUTCMonth(); const past = value < today; const selected = value === checkIn || value === checkOut; const inRange = !!checkIn && !!checkOut && value > checkIn && value < checkOut; return <button type="button" key={value} disabled={past || availability !== "available"} className={`${outside ? "outside" : ""} ${availability} ${selected ? "selected" : ""} ${inRange ? "in-range" : ""} season-${rate.season}`} onClick={() => chooseDate(value)}><span>{date.getUTCDate()}</span><small>{money(rate.price, language)}</small></button>; })}</div>
      <div className="calendar-legend"><span><i className="open"/>{t.available}</span><span><i className="reserved"/>{t.reserved}</span><span><i className="blocked"/>{t.blocked}</span><span><i className="low"/>{t.low}</span><span><i className="mid"/>{t.mid}</span><span><i className="high"/>{t.high}</span></div><button className="clear-dates" type="button" onClick={clearDates}>{t.clear}</button>
    </div><div className="date-inputs"><label>{t.checkIn}<input type="date" value={checkIn} min={today} onChange={(e) => { updateRange("", ""); chooseDate(e.target.value); }}/></label><label>{t.checkOut}<input type="date" value={checkOut} min={checkIn || today} onChange={(e) => chooseDate(e.target.value)}/></label></div><div className="booking-info"><Info/><p><strong>{t.before}:</strong> {t.braceletText}</p></div></div>
    <aside className="quote-card" aria-live="polite"><p className="quote-kicker">{t.budget}</p><h3>{t.property}</h3>{daily.length ? <><div className="quote-facts"><span>{t.checkIn}<b>{fullDate(checkIn, language)}</b></span><span>{t.checkOut}<b>{fullDate(checkOut, language)}</b></span><span>{t.nights}<b>{daily.length}</b></span></div><h4>{t.nightly}</h4><div className="night-list">{daily.map((item) => <div key={item.date}><span>{shortDate(item.date, language)}<small>{t[item.season]}</small></span><b>{money(item.price, language)}</b></div>)}</div><p className="checkout-note">{t.checkoutNote}</p><div className="quote-line"><span>{t.lodging}</span><b>{money(lodging, language)}</b></div><div className="quote-line"><span>{t.cleaning}</span><b>{money(CLEANING_FEE, language)}</b></div><div className="quote-total"><span>{t.total}<small>USD · PH 1401</small></span><b>{money(total, language)}</b></div></> : <div className="empty-quote"><CalendarDays/><p>{t.select}</p></div>}<div className="bracelet-card"><Info/><div><strong>{t.braceletTitle}</strong><p>{t.braceletText}</p><b>{t.external}: {olderGuests} × {money(BRACELET_FEE, language)} = {money(braceletEstimate, language)}</b></div></div></aside></div>
    <form className="request-card" onSubmit={submit}><h3>{t.request}</h3><div className="request-fields"><label className="wide">{t.name}<input value={name} onChange={(e)=>setName(e.target.value)} required/></label><label>{t.email}<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label><label>{t.phone}<input type="tel" placeholder="+593…" value={phone} onChange={(e)=>setPhone(e.target.value)} required/></label><label>{t.guests}<input type="number" min="1" max="10" value={guests} onChange={(e)=>{const n=Math.max(1,Math.min(10,Number(e.target.value)||1));setGuests(n);setOlderGuests(Math.min(olderGuests,n));}} required/></label><label>{t.older}<input type="number" min="0" max={guests} value={olderGuests} onChange={(e)=>setOlderGuests(Math.max(0,Math.min(guests,Number(e.target.value)||0)))}/></label><p className="field-help wide">{t.olderHelp}</p><label className="wide">{t.comments}<textarea value={comments} onChange={(e)=>setComments(e.target.value)} rows={4}/></label></div><label className="consent"><input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} required/><span>{t.consent}</span></label>{error&&<p className="booking-error" role="alert">{error}</p>}{status&&<p className="booking-success" role="status">{status}</p>}<button className="request-submit" disabled={sending || !daily.length || !consent}><MessageCircle/>{sending?t.sending:t.submit}</button></form>
  </section>;
}
