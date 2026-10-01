"use client";
import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/lib/platform/types";
export function ActionForm({
  action,
  children,
  label = "Guardar",
  className = "",
  hideOnSuccess = false,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  children?: ReactNode;
  label?: string;
  className?: string;
  hideOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={`platform-form ${className}`}
      aria-busy={pending}
    >
      {(!state.ok || !hideOnSuccess) && (
        <>
          {children}
          <button className="btn-primary" disabled={pending}>
            {pending ? "Procesando…" : label}
          </button>
        </>
      )}
      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="form-error">
            {state.error}
          </p>
        )}
        {state.mensaje && <p className="form-message">{state.mensaje}</p>}
      </div>
    </form>
  );
}
