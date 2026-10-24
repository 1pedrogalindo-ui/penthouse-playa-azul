"use client";

import { FormEvent, useState } from "react";
import { KeyRound, LockKeyhole } from "lucide-react";

export default function AccountingAccess() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/accounting/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
    setLoading(false);
    if (!response.ok) return setError("La clave de acceso no es correcta.");
    window.location.href = "/contabilidad";
  }
  return <main className="accounting-login"><section><img className="login-emblem" src="/images/ph1401-sunset-emblem.png" alt="PH 1401 · Penthouse Playa Azul"/><div className="accounting-badge"><LockKeyhole/> Área privada</div><h1>Contabilidad<br/><i>PH 1401</i></h1><p>Movimientos, reservas, gastos, libros e informes del Penthouse Playa Azul.</p><form onSubmit={submit}><label><span><KeyRound/> Clave de acceso</span><input type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(e)=>setPin(e.target.value)} required autoFocus/></label>{error&&<p className="form-error">{error}</p>}<button disabled={loading}>{loading?"Verificando…":"Ingresar al sistema"}</button></form><small>Información privada · Acceso autorizado únicamente</small></section></main>;
}
