import Link from "next/link";
import { notFound } from "next/navigation";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({
  params,
}: PageProps<"/checkout/[estado]">) {
  const { estado } = await params;
  if (!["exito", "pendiente", "error"].includes(estado)) notFound();
  return (
    <main className="contenedor py-20 max-w-2xl">
      <p className="eyebrow">PSICOMAR / COMPRA</p>
      <h1 className="text-4xl mt-5">
        {estado === "error"
          ? "Tu pedido sigue guardado."
          : "Estamos verificando tu pago."}
      </h1>
      <p className="mt-6 leading-relaxed">
        La confirmación depende del estado que recibamos de Mercado Pago. Podés
        consultar el resultado y tu acceso en Mis compras.
      </p>
      <Link href="/cuenta/compras" className="btn-primary mt-8">
        Ver mis compras
      </Link>
    </main>
  );
}
