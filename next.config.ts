import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ...(process.env.PSICOMAR_LOCAL_TEST === "1" ? { cpus: 1 } : {}),
    serverActions: { bodySizeLimit: "4mb" },
  },
  async redirects() {
    return [
      { source: "/atencion-clinica", destination: "/terapia", permanent: true },
      {
        source: "/para-profesionales",
        destination: "/academia",
        permanent: true,
      },
      {
        source: "/mi-cuenta/:path*",
        destination: "/cuenta/:path*",
        permanent: true,
      },
    ];
  },
  outputFileTracingIncludes: {
    "/api/certificados/*": [
      "./assets/fonts/*.ttf",
      "./public/logo-psicomar-blanco.png",
    ],
  },
  images: {
    // Permitir pedir calidades más altas que el default (75) a next/image.
    qualities: [75, 88, 95],
    // Imágenes subidas desde el panel (Vercel Blob, store público).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
