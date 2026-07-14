import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side packages that should not be bundled for the client
  serverExternalPackages: ["exceljs", "@prisma/client", "prisma"],

  // Fix Turbopack picking wrong workspace root when multiple lockfiles exist
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
