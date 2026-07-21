import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side packages that should not be bundled for the client
  // Only externalize packages that truly cannot be bundled
  serverExternalPackages: ["exceljs", "@prisma/client", "prisma"],

  // Fix Turbopack picking wrong workspace root
  turbopack: {
    root: process.cwd(),
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
