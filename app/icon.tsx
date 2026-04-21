import path from "node:path";
import { readFile } from "node:fs/promises";

import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = { width: 32, height: 32 };

export const contentType = "image/png";

async function getLogoDataUrl() {
  const bytes = await readFile(path.join(process.cwd(), "public", "brand", "AutriFix-logo-n.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

export default async function Icon() {
  const logo = await getLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030712",
          borderRadius: 8,
        }}
      >
        <img src={logo} alt="AutriFix logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    ),
    { ...size },
  );
}
