import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "chart.js",
      "react-chartjs-2",
    ],
  },
};

export default nextConfig;

