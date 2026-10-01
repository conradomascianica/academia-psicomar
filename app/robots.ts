import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: process.env.VERCEL_ENV === "preview" ? undefined : "/",
      disallow:
        process.env.VERCEL_ENV === "preview"
          ? ["/"]
          : [
              "/cuenta",
              "/registro",
              "/ingresar",
              "/recuperar",
              "/verificar",
              "/certificados",
              "/admin",
              "/mi-cuenta",
              "/checkout",
              "/acceso",
              "/api",
            ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
