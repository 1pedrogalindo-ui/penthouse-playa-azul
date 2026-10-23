"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "./autorizaciones.module.css";

type FormState = {
  city: string;
  issueDate: string;
  honorific: "Sr" | "Sra";
  guest: string;
  idType: "CÉDULA DE CIUDADANÍA" | "PASAPORTE";
  identification: string;
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  departureTime: string;
  occupants: string;
  hostPhone: string;
};

function localDateInput(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

const initialState: FormState = {
  city: "Quito",
  issueDate: localDateInput(),
  honorific: "Sr",
  guest: "",
  idType: "CÉDULA DE CIUDADANÍA",
  identification: "",
  arrivalDate: "",
  arrivalTime: "13:00",
  departureDate: "",
  departureTime: "11:00",
  occupants: "",
  hostPhone: "+593 98 8335552",
};

const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function longDate(value: string) {
  if (!value) return "________________";
  const [year, month, day] = value.split("-").map(Number);
  return `${months[month - 1]} ${day} / ${year}`;
}

function issueDate(value: string) {
  if (!value) return "________________";
  const [year, month, day] = value.split("-").map(Number);
  return `${months[month - 1]} ${day} del ${year}`;
}

const rules = [
  <>Uso obligatorio de brazaletes. (Debe cancelar al ingreso a la administración del edificio $5 por persona, a excepción de menores de 7 años).</>,
  <>Por seguridad, no está permitido ingerir bebidas alcohólicas ni alimentos en la piscina o en el borde de la piscina.</>,
  <><strong>Prohibido el ingreso de mascotas.</strong></>,
  <>Ingreso de 2 vehículos en el área de parqueaderos de nuestra propiedad. Por parqueaderos adicionales, la administración del edificio cobra $5,00 diarios.</>,
  <>Una vez realizada la reserva, no hay devolución del arrendamiento en caso de cambio de fechas de entrada y salida.</>,
  <>Las demás condiciones de uso adecuado de las instalaciones y del departamento son las acordadas previamente. El uso inadecuado, daño o destrucción de las instalaciones es responsabilidad del arrendatario, quien deberá cancelar los valores correspondientes antes de salir del edificio.</>,
];

export function AuthorizationGenerator() {
  const [form, setForm] = useState<FormState>(initialState);
  const [message, setMessage] = useState("");

  const dateError = useMemo(() => {
    if (!form.arrivalDate || !form.departureDate) return "";
    const arrival = new Date(`${form.arrivalDate}T${form.arrivalTime || "00:00"}:00`);
    const departure = new Date(`${form.departureDate}T${form.departureTime || "00:00"}:00`);
    return departure <= arrival ? "La salida debe ser posterior al ingreso." : "";
  }, [form.arrivalDate, form.arrivalTime, form.departureDate, form.departureTime]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  function printAuthorization(event: FormEvent) {
    event.preventDefault();
    if (dateError) {
      setMessage(dateError);
      return;
    }
    setMessage("");
    document.title = `Autorización PH1401 - ${form.guest.trim() || "Huésped"}`;
    window.print();
  }

  async function logout() {
    await fetch("/api/autorizaciones/session", { method: "DELETE" });
    window.location.replace("/autorizaciones/acceso");
  }

  return (
    <main className={styles.generatorPage}>
      <header className={styles.toolHeader}>
        <div><span>PH 1401 · Herramienta privada</span><h1>Autorizaciones de ingreso</h1></div>
        <button type="button" onClick={logout} className={styles.logout}>Cerrar sesión</button>
      </header>

      <div className={styles.workspace}>
        <form className={styles.formPanel} onSubmit={printAuthorization}>
          <div className={styles.formIntro}>
            <span>Nuevo documento</span><h2>Datos de la estadía</h2>
            <p>Completa los campos y revisa la autorización antes de guardarla como PDF.</p>
          </div>

          <fieldset>
            <legend>Emisión</legend>
            <div className={styles.twoColumns}>
              <label>Ciudad<input value={form.city} onChange={(e) => update("city", e.target.value)} required /></label>
              <label>Fecha de emisión<input type="date" value={form.issueDate} onChange={(e) => update("issueDate", e.target.value)} required /></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Huésped principal</legend>
            <div className={styles.nameRow}>
              <label>Tratamiento<select value={form.honorific} onChange={(e) => update("honorific", e.target.value as FormState["honorific"])}><option>Sr</option><option>Sra</option></select></label>
              <label>Nombre completo<input value={form.guest} onChange={(e) => update("guest", e.target.value)} placeholder="Ej. Alfonso Trejo" required /></label>
            </div>
            <div className={styles.twoColumns}>
              <label>Documento<select value={form.idType} onChange={(e) => update("idType", e.target.value as FormState["idType"])}><option>CÉDULA DE CIUDADANÍA</option><option>PASAPORTE</option></select></label>
              <label>Número<input value={form.identification} onChange={(e) => update("identification", e.target.value)} placeholder="1713181327" required /></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Ingreso y salida</legend>
            <div className={styles.twoColumns}>
              <label>Fecha de ingreso<input type="date" value={form.arrivalDate} onChange={(e) => update("arrivalDate", e.target.value)} required /></label>
              <label>Hora de ingreso<input type="time" value={form.arrivalTime} onChange={(e) => update("arrivalTime", e.target.value)} required /></label>
              <label>Fecha de salida<input type="date" value={form.departureDate} min={form.arrivalDate} onChange={(e) => update("departureDate", e.target.value)} required /></label>
              <label>Hora de salida<input type="time" value={form.departureTime} onChange={(e) => update("departureTime", e.target.value)} required /></label>
            </div>
            <label>Ocupantes<input type="number" min="1" max="20" value={form.occupants} onChange={(e) => update("occupants", e.target.value)} placeholder="10" required /></label>
            {dateError && <p className={styles.fieldError}>{dateError}</p>}
          </fieldset>

          <details className={styles.advancedFields}>
            <summary>Datos fijos del documento</summary>
            <label>Teléfono del anfitrión<input value={form.hostPhone} onChange={(e) => update("hostPhone", e.target.value)} required /></label>
          </details>
          {message && <div className={styles.formMessage} role="alert">{message}</div>}
          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setForm(initialState)}>Limpiar</button>
            <button type="submit" className={styles.primaryButton}>Imprimir / guardar PDF</button>
          </div>
          <p className={styles.printHint}>En la ventana de impresión selecciona <strong>Guardar como PDF</strong>.</p>
        </form>

        <section className={styles.previewPanel} aria-label="Vista previa de la autorización">
          <div className={styles.previewLabel}><span>Vista previa</span><small>A4 · 1 página</small></div>
          <article className={styles.document} id="authorization-document">
            <div className={styles.documentHeader}>
              <img src="/authorization/deymar-logo.png" alt="Logo Deymar" />
              <div><h2>EDIFICIO RESIDENCIAL MULTIFAMILIARES</h2><h3>“DEYMAR”</h3></div>
            </div>
            <p className={styles.documentDate}>{form.city || "Quito"}, {issueDate(form.issueDate)}</p>
            <h1>AUTORIZACIÓN DE INGRESO AL PENTHOUSE 1401</h1>
            <dl className={styles.guestData}>
              <div><dt>HUÉSPED:</dt><dd>{form.honorific} {form.guest.trim().toLocaleUpperCase("es-EC") || "________________"}</dd></div>
              <div><dt>{form.idType}:</dt><dd>{form.identification || "________________"}</dd></div>
              <div><dt>FECHA DE INGRESO:</dt><dd>{longDate(form.arrivalDate)}</dd></div>
              <div><dt>HORA DE INGRESO:</dt><dd>{form.arrivalTime || "__:__"} Horas</dd></div>
              <div><dt>FECHA DE SALIDA:</dt><dd>{longDate(form.departureDate)}</dd></div>
              <div><dt>HORA DE SALIDA:</dt><dd>{form.departureTime || "__:__"} Horas</dd></div>
              <div><dt>OCUPANTES:</dt><dd>{form.occupants || "__"} {form.occupants === "1" ? "persona" : "personas"}</dd></div>
            </dl>
            <section className={styles.rules}>
              <h2>NORMAS GENERALES</h2>
              <ul>{rules.map((rule, index) => <li key={index}>{rule}</li>)}</ul>
            </section>
            <p className={styles.note}><strong>NOTA:</strong> Presentar la imagen de esta autorización antes de ingresar al edificio.</p>
            <footer className={styles.documentFooter}>Contacto del Anfitrión: Cel. {form.hostPhone}</footer>
          </article>
        </section>
      </div>
    </main>
  );
}
