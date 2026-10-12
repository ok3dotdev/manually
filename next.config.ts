import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Lets the dev server be viewed through a VS Code dev tunnel.
  allowedDevOrigins: ["**.devtunnels.ms"],
  experimental: {
    serverActions: {
      // Default is 1MB, too small for PDF uploads. Kept under Vercel's 4.5MB
      // function request body limit; MAX_PDF_SIZE_BYTES leaves headroom for
      // multipart overhead.
      bodySizeLimit: '4.5mb',
      // Dev tunnels rewrite the Origin header to the local address while
      // x-forwarded-host carries the tunnel host, which Next's CSRF check
      // rejects. Dev only, so production keeps the strict same-origin check.
      allowedOrigins: isDev ? ["localhost:3000", "localhost:3001"] : [],
    },
  },
};

export default nextConfig;
