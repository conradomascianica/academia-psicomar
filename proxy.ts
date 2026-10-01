import { NextResponse, type NextRequest } from "next/server";
import { verificarToken, NOMBRE_COOKIE_SESION } from "@/lib/auth/jwt";

/**
 * Chequeo optimista (Next 16 llama "Proxy" a lo que antes era Middleware).
 * La seguridad real la hace cada página/acción con el DAL (lib/auth/dal.ts).
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(NOMBRE_COOKIE_SESION)?.value;
  const sesion = await verificarToken(token);

  const esAdmin = pathname.startsWith("/admin");
  const esCuenta = pathname.startsWith("/cuenta") || pathname === "/checkout";

  if ((esAdmin || esCuenta) && !sesion) {
    const url = new URL(esCuenta ? "/ingresar" : "/acceso", req.url);
    url.searchParams.set("volver", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (esAdmin && sesion?.rol !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*", "/checkout"],
};
