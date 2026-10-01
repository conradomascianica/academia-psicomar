"use client";
import { useState } from "react";
import { ActionForm } from "./ActionForm";
import { solicitarAdmision } from "@/lib/acciones/plataforma";
export function AdmisionForm({ solicitudKey }: { solicitudKey: string }) {
  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires");
  return (
    <ActionForm
      action={solicitarAdmision}
      label="Enviar solicitud de admisión"
      hideOnSuccess
    >
      <input type="hidden" name="solicitudKey" value={solicitudKey} />
      <div className="hidden" aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          Nombre
          <input
            name="nombre"
            required
            minLength={2}
            maxLength={80}
            autoComplete="given-name"
          />
        </label>
        <label>
          Apellido
          <input
            name="apellido"
            required
            minLength={2}
            maxLength={80}
            autoComplete="family-name"
          />
        </label>
      </div>
      <label>
        Email
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
        />
      </label>
      <label>
        WhatsApp con código de país
        <input
          name="whatsapp"
          type="tel"
          required
          maxLength={25}
          placeholder="+54 9…"
          autoComplete="tel"
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          País
          <input
            name="pais"
            required
            maxLength={80}
            autoComplete="country-name"
            defaultValue="Argentina"
          />
        </label>
        <label>
          Zona horaria
          <input
            name="zonaHoraria"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            required
            maxLength={100}
          />
        </label>
      </div>
      <button
        type="button"
        className="text-left text-sm underline"
        onClick={() =>
          setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
        }
      >
        Usar la zona horaria de mi dispositivo
      </button>
      <label>
        Disponibilidad general
        <textarea
          name="disponibilidad"
          required
          minLength={3}
          maxLength={300}
          rows={3}
          placeholder="Por ejemplo: lunes a viernes por la tarde"
        />
      </label>
      <label>
        Prefiero que me contacten por
        <select name="contacto">
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
      </label>
      <p className="text-sm text-tinta-suave">
        No incluyas síntomas, diagnósticos ni información clínica. Este
        formulario es únicamente administrativo.
      </p>
      <label className="check-label">
        <input type="checkbox" name="mayor" required />
        Confirmo que soy mayor de 18 años.
      </label>
      <label className="check-label">
        <input type="checkbox" name="privacidad" required />
        <span>
          Leí la{" "}
          <a href="/privacidad" target="_blank" rel="noreferrer">
            política de privacidad
          </a>{" "}
          y autorizo el uso de estos datos para coordinar mi admisión.
        </span>
      </label>
    </ActionForm>
  );
}
