"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info, MessageCircle } from "lucide-react";
import { trackEvent } from "@/components/analytics";

type Language = "es" | "en";
type Unavailable = { check_in: string; check_out: string; status: "pending" | "confirmed" | "blocked" };
const DAY_MS = 86_400_000;

const copy = {
  es: {
    kicker: "Reserva directa · disponibilidad real", title: "Reserva tu estadía frente al mar",
    intro: "Selecciona entrada y salida para consultar la disponibilidad real del penthouse.",
    stay: "Tu alojamiento", dates: "Tus fechas", property: "Penthouse dúplex PH 1401",
    capacity: "Hasta 10 huéspedes · 1 unidad", calendarHelp: "Selecciona las fechas de entrada y salida",
    available: "Disponible", reserved: "Reservada", blocked: "Bloqueada",
    clear: "Borrar fechas", checkIn: "Entrada", checkOut: "Salida", nights: "Noches", budget: "Resumen de la reserva",
    summaryNote: "Te contactaremos para confirmar la tarifa aplicable y completar la reserva.", braceletTitle: "Brazaletes de ingreso · cargo externo",
    braceletText: "La administración del edificio puede cobrar brazaletes por huésped. Confirmaremos el valor vigente antes de tu llegada.",
    request: "Solicita tu reserva", name: "Nombre y apellido", email: "Correo electrónico", phone: "WhatsApp",
    guests: "Número total de huéspedes", older: "Mayores de 7 años", olderHelp: "Dato para estimar los brazaletes que se pagan a la administración del edificio.",
    comments: "Comentarios (opcional)", consent: "Autorizo el uso de estos datos únicamente para gestionar mi solicitud y contactarme. Enviar la solicitud no confirma la reserva ni realiza un cobro.",
    submit: "Solicitar reserva", sending: "Enviando…",
    invalid: "Selecciona una fecha de salida posterior a la entrada.", unavailableRange: "El rango incluye una fecha reservada o bloqueada.",
    sent: "Solicitud registrada. Abriremos WhatsApp para continuar.", before: "Antes de reservar",
  },
  en: {
    kicker: "Direct booking · live availability", title: "Book your oceanfront stay",
    intro: "Select check-in and check-out to consult the penthouse's live availability.",
    stay: "Your accommodation", dates: "Your dates", property: "PH 1401 duplex penthouse",
    capacity: "Up to 10 guests · 1 unit", calendarHelp: "Select your check-in and check-out dates",
    available: "Available", reserved: "Reserved", blocked: "Blocked",
    clear: "Clear dates", checkIn: "Check-in", checkOut: "Check-out", nights: "Nights", budget: "Booking summary",
    summaryNote: "We will contact you to confirm the applicable rate and complete your booking.", braceletTitle: "Entry wristbands · external charge",
    braceletText: "Building management may charge wristbands per guest. We will confirm the current amount before your arrival.",
    request: "Request your booking", name: "Full name", email: "Email", phone: "WhatsApp",
    guests: "Total guests", older: "Guests over 7", olderHelp: "Used to estimate wristbands paid directly to building management.",
    comments: "Comments (optional)", consent: "I authorize use of this data only to process my request and contact me. Sending the request does not confirm a booking or make a charge.",
    submit: "Request booking", sending: "Sending…",
    invalid: "Choose a check-out date after check-in.", unavailableRange: "This range includes a reserved or blocked date.",
    sent: "Request saved. We will open WhatsApp to continue.", before: "Before booking",
  },
} as const;

function iso(date: Date) { return date.toISOString().slice(0, 10); }
function parseDate(value: string) { return new Date(`${value}T00:00:00Z`); }
function addDays(date: Date, days: number) { return new Date(date.getTime() + days * DAY_MS); }
function fullDate(value: string, language: Language) { return value ? new Intl.DateTimeFormat(language === "es" ? "es-EC" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parseDate(value)) : "—"; }
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
  const daily = useMemo<string[]>(() => { if (!checkIn || !checkOut || checkOut <= checkIn) return []; const result: string[] = []; for (let cursor = parseDate(checkIn); iso(cursor) < checkOut; cursor = addDays(cursor, 1)) result.push(iso(cursor)); return result; }, [checkIn, checkOut]);
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
    const payload = { guest_name: name, phone, email, check_in: checkIn, check_out: checkOut, guests, guests_over_7: olderGuests, comments };
    const response = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); setSending(false);
    if (!response.ok) { setError(result.error || "No pudimos registrar la solicitud."); return; } setStatus(t.sent);
    const message = language === "es" ? `Hola, quiero solicitar una reserva del Penthouse PH 1401.\n\nEntrada: ${fullDate(checkIn, language)}\nSalida: ${fullDate(checkOut, language)}\nHuéspedes: ${guests}\nNoches: ${daily.length}\n\nPor favor, confírmame disponibilidad y tarifa.` : `Hello, I would like to request a booking for PH 1401.\n\nCheck-in: ${fullDate(checkIn, language)}\nCheck-out: ${fullDate(checkOut, language)}\nGuests: ${guests}\nNights: ${daily.length}\n\nPlease confirm availability and the applicable rate.`;
    trackEvent("generate_lead", { lead_source: "booking_calendar", language, nights: daily.length, guests }, "Lead"); window.open(`https://wa.me/593988335552?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }
  const monthLabel = new Intl.DateTimeFormat(language === "es" ? "es-EC" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(month);
  const weekdays = language === "es" ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return <section id="reservar" className="booking-section section-pad">
    <div className="booking-heading"><div><p className="kicker">{t.kicker}</p><h2>{t.title}</h2></div><p>{t.intro}</p></div>
    <div className="property-step"><p>1 · {t.stay}</p><article className="property-card"><div className="property-photo"/><div><h3>{t.property}</h3><p>{t.capacity}</p></div></article></div>
    <div className={`reservation-grid ${daily.length ? "has-summary" : "dates-only"}`}><div className="calendar-column"><p className="booking-step">2 · {t.dates}</p><div className="booking-calendar">
      <header><button type="button" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))} aria-label="Mes anterior"><ChevronLeft/></button><strong>{monthLabel}</strong><button type="button" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))} aria-label="Mes siguiente"><ChevronRight/></button></header>
      <p>{t.calendarHelp}</p><div className="weekday-row">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="month-grid">{monthDays.map((date) => { const value = iso(date); const availability = statusFor(value); const outside = date.getUTCMonth() !== month.getUTCMonth(); const past = value < today; const selected = value === checkIn || value === checkOut; const inRange = !!checkIn && !!checkOut && value > checkIn && value < checkOut; return <button type="button" key={value} disabled={past || availability !== "available"} className={`${outside ? "outside" : ""} ${availability} ${selected ? "selected" : ""} ${inRange ? "in-range" : ""}`} onClick={() => chooseDate(value)}><span>{date.getUTCDate()}</span></button>; })}</div>
      <div className="calendar-legend"><span><i className="open"/>{t.available}</span><span><i className="reserved"/>{t.reserved}</span><span><i className="blocked"/>{t.blocked}</span></div><button className="clear-dates" type="button" onClick={clearDates}>{t.clear}</button>
    </div><div className="date-inputs"><label>{t.checkIn}<input type="date" value={checkIn} min={today} onChange={(e) => { updateRange("", ""); chooseDate(e.target.value); }}/></label><label>{t.checkOut}<input type="date" value={checkOut} min={checkIn || today} onChange={(e) => chooseDate(e.target.value)}/></label></div><div className="booking-info"><Info/><p><strong>{t.before}:</strong> {t.braceletText}</p></div></div>
    {daily.length > 0 && <aside className="quote-card booking-summary-card" aria-live="polite"><p className="quote-kicker">{t.budget}</p><h3>{t.property}</h3><div className="quote-facts"><span>{t.checkIn}<b>{fullDate(checkIn, language)}</b></span><span>{t.checkOut}<b>{fullDate(checkOut, language)}</b></span><span>{t.nights}<b>{daily.length}</b></span></div><p className="summary-note">{t.summaryNote}</p><div className="bracelet-card"><Info/><div><strong>{t.braceletTitle}</strong><p>{t.braceletText}</p></div></div></aside>}</div>
    <form className="request-card" onSubmit={submit}><h3>{t.request}</h3><div className="request-fields"><label className="wide">{t.name}<input value={name} onChange={(e)=>setName(e.target.value)} required/></label><label>{t.email}<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label><label>{t.phone}<input type="tel" placeholder="+593…" value={phone} onChange={(e)=>setPhone(e.target.value)} required/></label><label>{t.guests}<input type="number" min="1" max="10" value={guests} onChange={(e)=>{const n=Math.max(1,Math.min(10,Number(e.target.value)||1));setGuests(n);setOlderGuests(Math.min(olderGuests,n));}} required/></label><label>{t.older}<input type="number" min="0" max={guests} value={olderGuests} onChange={(e)=>setOlderGuests(Math.max(0,Math.min(guests,Number(e.target.value)||0)))}/></label><p className="field-help wide">{t.olderHelp}</p><label className="wide">{t.comments}<textarea value={comments} onChange={(e)=>setComments(e.target.value)} rows={4}/></label></div><label className="consent"><input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} required/><span>{t.consent}</span></label>{error&&<p className="booking-error" role="alert">{error}</p>}{status&&<p className="booking-success" role="status">{status}</p>}<button className="request-submit" disabled={sending || !daily.length || !consent}><MessageCircle/>{sending?t.sending:t.submit}</button></form>
  </section>;
}
