"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, Check, MessageCircle, Moon, Users } from "lucide-react";
import { trackEvent } from "@/components/analytics";

type Language = "es" | "en";
type Season = "low" | "mid" | "high";

const rates: Record<Season, number> = { low: 180, mid: 200, high: 230 };

const content = {
  es: {
    kicker: "Reserva directa · sin intermediarios",
    title: "Elige tus fechas y calcula tu estadía",
    intro: "Selecciona la temporada, las fechas y el número de huéspedes. Verás un estimado antes de enviar tu solicitud por WhatsApp.",
    seasons: {
      low: ["Temporada baja", "Fechas regulares"],
      mid: ["Temporada media", "Fechas de mayor demanda"],
      high: ["Temporada alta", "Feriados y fechas pico"],
    },
    perNight: "por noche", checkIn: "Entrada", checkOut: "Salida", guests: "Huéspedes",
    summary: "Resumen de tu estadía", nights: "Noches", rate: "Tarifa por noche", total: "Total estimado",
    selectDates: "Selecciona fechas válidas para calcular el total.",
    name: "Nombre completo", phone: "WhatsApp", email: "Correo (opcional)",
    notice: "Registraremos tu solicitud y confirmaremos disponibilidad y tarifa final por WhatsApp.",
    submit: "Enviar solicitud de reserva", invalid: "La fecha de salida debe ser posterior a la fecha de entrada.", sent: "Solicitud registrada. Abriremos WhatsApp para continuar.",
  },
  en: {
    kicker: "Direct booking · no middlemen",
    title: "Choose your dates and estimate your stay",
    intro: "Select the season, dates and number of guests. You will see an estimate before sending your request through WhatsApp.",
    seasons: {
      low: ["Low season", "Regular dates"],
      mid: ["Mid season", "Higher-demand dates"],
      high: ["High season", "Holidays and peak dates"],
    },
    perNight: "per night", checkIn: "Check-in", checkOut: "Check-out", guests: "Guests",
    summary: "Your stay summary", nights: "Nights", rate: "Nightly rate", total: "Estimated total",
    selectDates: "Select valid dates to calculate the total.",
    name: "Full name", phone: "WhatsApp", email: "Email (optional)",
    notice: "We will register your request and confirm availability and the final rate through WhatsApp.",
    submit: "Send booking request", invalid: "Check-out must be after check-in.", sent: "Request registered. We will open WhatsApp to continue.",
  },
} as const;

function localInputDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMoney(value: number, language: Language) {
  return new Intl.NumberFormat(language === "es" ? "es-EC" : "en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string, language: Language) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "es" ? "es-EC" : "en-US", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function BookingCalculator({ language }: { language: Language }) {
  const t = content[language];
  const [season, setSeason] = useState<Season>("low");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const today = localInputDate();

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const difference = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
    return Math.max(0, Math.round(difference / 86_400_000));
  }, [checkIn, checkOut]);

  const price = rates[season];
  const total = nights * price;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (nights < 1) { setError(t.invalid); return; }
    setError(""); setStatus(""); setSending(true);
    const response = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guest_name:name, phone, email:email||null, check_in:checkIn, check_out:checkOut, guests, season, nightly_rate:price, total }) });
    const result = await response.json(); setSending(false);
    if (!response.ok) { setError(result.error || "No pudimos registrar la solicitud."); return; }
    setStatus(t.sent);
    const seasonName = t.seasons[season][0];
    const message = language === "es"
      ? `Hola, quiero solicitar una reserva del Penthouse Playa Azul.\n\nEntrada: ${formatDate(checkIn, language)}\nSalida: ${formatDate(checkOut, language)}\nHuéspedes: ${guests}\nTemporada seleccionada: ${seasonName}\nTarifa: ${formatMoney(price, language)} por noche\nNoches: ${nights}\nTotal estimado: ${formatMoney(total, language)}\n\nPor favor, confírmame disponibilidad y tarifa final.`
      : `Hello, I would like to request a booking for Penthouse Playa Azul.\n\nCheck-in: ${formatDate(checkIn, language)}\nCheck-out: ${formatDate(checkOut, language)}\nGuests: ${guests}\nSelected season: ${seasonName}\nRate: ${formatMoney(price, language)} per night\nNights: ${nights}\nEstimated total: ${formatMoney(total, language)}\n\nPlease confirm availability and the final rate.`;
    trackEvent("generate_lead", { lead_source: "booking_calculator", cta_location: "booking_section", language, season, nights, guests, estimated_total: total }, "Lead");
    window.open(`https://wa.me/593988335552?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section id="reservar" className="booking-section section-pad">
      <div className="booking-heading">
        <div><p className="kicker">{t.kicker}</p><h2>{t.title}</h2></div>
        <p>{t.intro}</p>
      </div>
      <form className="booking-shell" onSubmit={submit}>
        <fieldset className="season-grid">
          <legend className="sr-only">{language === "es" ? "Temporada" : "Season"}</legend>
          {(Object.keys(rates) as Season[]).map((item) => (
            <label className={`season-card ${season === item ? "selected" : ""}`} key={item}>
              <input type="radio" name="season" value={item} checked={season === item} onChange={() => setSeason(item)} />
              <span className="season-check"><Check /></span><small>{t.seasons[item][0]}</small>
              <strong>{formatMoney(rates[item], language)}</strong><span>{t.perNight}</span><p>{t.seasons[item][1]}</p>
            </label>
          ))}
        </fieldset>
        <div className="booking-details">
          <div className="booking-fields">
            <label><span>{t.name}</span><input type="text" value={name} onChange={(event)=>setName(event.target.value)} required /></label>
            <label><span>{t.phone}</span><input type="tel" value={phone} onChange={(event)=>setPhone(event.target.value)} required /></label>
            <label><span>{t.email}</span><input type="email" value={email} onChange={(event)=>setEmail(event.target.value)} /></label>
            <label><span><CalendarDays />{t.checkIn}</span><input type="date" min={today} value={checkIn} onChange={(event) => { setCheckIn(event.target.value); setError(""); }} required /></label>
            <label><span><CalendarDays />{t.checkOut}</span><input type="date" min={checkIn || today} value={checkOut} onChange={(event) => { setCheckOut(event.target.value); setError(""); }} required /></label>
            <label><span><Users />{t.guests}</span><input type="number" min="1" max="10" value={guests} onChange={(event) => setGuests(Math.max(1, Math.min(10, Number(event.target.value) || 1)))} required /></label>
          </div>
          <aside className="booking-summary" aria-live="polite">
            <p className="booking-summary-title">{t.summary}</p>
            <div><span>{t.checkIn}</span><strong>{formatDate(checkIn, language)}</strong></div>
            <div><span>{t.checkOut}</span><strong>{formatDate(checkOut, language)}</strong></div>
            <div><span>{t.nights}</span><strong><Moon />{nights || "—"}</strong></div>
            <div><span>{t.rate}</span><strong>{formatMoney(price, language)}</strong></div>
            <div className="booking-total"><span>{t.total}</span><strong>{nights ? formatMoney(total, language) : "—"}</strong></div>
            {!nights && !error && <p className="booking-helper">{t.selectDates}</p>}
            {error && <p className="booking-error" role="alert">{error}</p>}
            {status && <p className="booking-success" role="status">{status}</p>}
            <button className="booking-submit" type="submit" disabled={sending}><MessageCircle />{sending ? (language === "es" ? "Enviando…" : "Sending…") : t.submit}</button>
            <p className="booking-notice">{t.notice}</p>
          </aside>
        </div>
      </form>
    </section>
  );
}
