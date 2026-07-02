import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side packages that should not be bundled for the client
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
