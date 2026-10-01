"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
export function TrackLink({
  evento,
  ...props
}: ComponentProps<typeof Link> & {
  evento: "cta_terapia" | "cta_academia" | "checkout_iniciado";
}) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        navigator.sendBeacon("/api/metricas", evento);
      }}
    />
  );
}
