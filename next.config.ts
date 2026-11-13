import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Expose only the (public) cloud name to the browser so the image loader works client-side.
  env: { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "" },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.ts",
    formats: ["image/webp"],
  },
  serverExternalPackages: ["mongoose"],
  // Keep visited + prefetched pages for 30 s in the browser, so moving between pages (and Back) is instant.
  // Any save you make clears this cache immediately, so you never see your own stale data.
  experimental: { staleTimes: { dynamic: 30, static: 30 } },
};

export default nextConfig;
