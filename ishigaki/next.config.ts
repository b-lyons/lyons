import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set NEXT_PUBLIC_BASE_PATH=/ishigaki to serve the guide under a sub-path
  // of an existing site. Leave unset to serve from the domain root.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,

  // Native (sharp) and wasm (libheif-js) modules have to be required at
  // runtime rather than bundled, or the image decoders break on Vercel.
  serverExternalPackages: ["sharp", "heic-convert", "libheif-js"],
};

export default nextConfig;
