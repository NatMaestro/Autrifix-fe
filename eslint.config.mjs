import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // Generated or build output. Linting these produced ~10,000 findings that drowned the
    // handful of real ones — which is a large part of why nobody was reading the output.
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "openapi/**",
      // Generated from the backend's OpenAPI schema by `npm run api:gen`; never edited.
      "lib/api-types.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // `next/image` cannot be used in these files. `icon`, `apple-icon`, and
    // `opengraph-image` render through Satori inside `ImageResponse`, which supports only
    // plain `<img>`. Flagging them is a false positive, not a deferred improvement.
    files: ["app/icon.tsx", "app/apple-icon.tsx", "app/opengraph-image.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  {
    // Avatars, vehicle photos, and map marker images come from a remote API host that
    // varies per environment, and from blob: preview URLs. `next/image` would need
    // build-time `remotePatterns` covering every deployment, and silently breaks on a host
    // it was not told about — a worse failure than an unoptimised image.
    files: [
      "app/**/profile/page.tsx",
      "app/customer/page.tsx",
      "app/provider/page.tsx",
      "components/map/leaflet-map-inner.tsx",
    ],
    rules: { "@next/next/no-img-element": "off" },
  },
];

export default eslintConfig;
