import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side packages that should not be bundled for the client
  serverExternalPackages: ["exceljs", "@prisma/client", "prisma", "pdf-parse"],

  // Fix Turbopack picking wrong workspace root when multiple lockfiles exist (local dev only)
  turbopack: {
    root: ".",
  },

  // Vercel deployment: allow images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
