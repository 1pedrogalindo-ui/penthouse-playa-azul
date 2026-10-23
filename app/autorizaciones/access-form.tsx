"use client";

import { useSearchParams } from "next/navigation";
import styles from "./autorizaciones.module.css";

export function AccessForm() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "1";
  return (
    <main className={styles.accessPage}>
      <section className={styles.accessCard} aria-labelledby="access-title">
        <img src="/authorization/deymar-logo.png" alt="Edificio Deymar" />
        <p className={styles.accessEyebrow}>Penthouse 1401 · Área privada</p>
        <h1 id="access-title">Generador de autorizaciones</h1>
        <p>Ingresa la clave de acceso para crear documentos de ingreso.</p>
        <form action="/api/autorizaciones/session" method="post">
          <label htmlFor="access-pin">Clave de acceso</label>
          <input id="access-pin" name="pin" type="password" inputMode="numeric" autoComplete="current-password" required autoFocus />
          {hasError && <div className={styles.accessError} role="alert">La clave no es correcta. Inténtalo nuevamente.</div>}
          <button type="submit">Ingresar</button>
        </form>
      </section>
    </main>
  );
}
