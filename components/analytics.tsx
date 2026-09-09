"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
const CONSENT_KEY = "ph1401_analytics_consent";

type Consent = "accepted" | "rejected" | null;
type EventParameters = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: string,
  parameters: EventParameters = {},
  metaEvent?: "Lead" | "ViewContent",
) {
  window.gtag?.("event", name, parameters);

  if (metaEvent) {
    window.fbq?.("track", metaEvent, parameters);
  } else {
    window.fbq?.("trackCustom", name, parameters);
  }
}

export function Analytics() {
  const [consent, setConsent] = useState<Consent>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const configured = Boolean(GA_ID || META_PIXEL_ID);

  useEffect(() => {
    if (!configured) return;
    const saved = window.localStorage.getItem(CONSENT_KEY);
    if (saved === "accepted" || saved === "rejected") setConsent(saved);
  }, [configured]);

  if (!configured) return null;

  const choose = (value: Exclude<Consent, null>) => {
    window.localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
    setShowPreferences(false);
  };

  const showBanner = consent === null || showPreferences;

  return (
    <>
      {consent === "accepted" && GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      )}

      {consent === "accepted" && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}

      {showBanner ? (
        <aside className="consent-banner" role="dialog" aria-label="Preferencias de privacidad" aria-live="polite">
          <div>
            <strong>Tu privacidad importa</strong>
            <p>
              Usamos medición de Google y Meta para conocer las visitas y mejorar la atención de solicitudes. No activamos estas herramientas sin tu permiso.
            </p>
          </div>
          <div className="consent-actions">
            <button type="button" className="consent-reject" onClick={() => choose("rejected")}>Rechazar</button>
            <button type="button" className="consent-accept" onClick={() => choose("accepted")}>Aceptar</button>
          </div>
        </aside>
      ) : (
        <button type="button" className="privacy-settings" onClick={() => setShowPreferences(true)}>
          Privacidad
        </button>
      )}
    </>
  );
}
