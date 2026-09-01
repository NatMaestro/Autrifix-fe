import path from "path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Re-enabled 2026-09-01. It was disabled because ESLint could not run at all — the
    // `@typescript-eslint` and `es-abstract` packages were truncated on disk, so every
    // invocation crashed. With those repaired and generated output excluded from linting,
    // the project reports 0 errors, and a build that ignores the linter is a linter nobody
    // reads. It had been hiding 26 `rules-of-hooks` violations in the two chat pages.
    ignoreDuringBuilds: false,
  },
  async redirects() {
    // The `/driver` and `/mechanic` route trees were renamed to `/customer` and
    // `/provider` to match the backend's vocabulary (ADR-020). These are permanent
    // because the old paths are gone for good — but they exist at all because a URL a
    // user bookmarked, or a link already sent to somebody, should not 404 over a rename
    // that means nothing to them.
    return [
      { source: "/driver", destination: "/customer", permanent: true },
      { source: "/driver/:path*", destination: "/customer/:path*", permanent: true },
      { source: "/mechanic", destination: "/provider", permanent: true },
      { source: "/mechanic/:path*", destination: "/provider/:path*", permanent: true },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd()),
    };
    return config;
  },
};

export default nextConfig;
