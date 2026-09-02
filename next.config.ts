import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The radio ships as a workspace package whose entry points at raw TS,
  // so Next has to compile it rather than treat it as prebuilt.
  transpilePackages: ["@ijodisco/radio-3d"],
  // The floating Next badge renders over the sidebar footer and would bake
  // itself into every visual baseline. Nothing about it is ours to ship.
  devIndicators: false,
};

export default nextConfig;
