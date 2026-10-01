"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="contenedor py-20">
      <h1 className="text-3xl">No pudimos cargar esta página.</h1>
      <p className="my-5">Intentá nuevamente en unos instantes.</p>
      <button className="btn-primary" onClick={reset}>
        Volver a intentar
      </button>
    </main>
  );
}
