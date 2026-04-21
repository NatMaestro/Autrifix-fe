import path from "node:path";
import { readFile } from "node:fs/promises";

import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "AutriFix — Roadside, reimagined";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

async function getLogoDataUrl() {
  const bytes = await readFile(path.join(process.cwd(), "public", "brand", "AutriFix-logo-n.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

export default async function OpenGraphImage() {
  const logo = await getLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(165deg, #030712 0%, #0B1F3A 45%, #111c30 100%)",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 36,
          }}
        >
          <img
            src={logo}
            alt="AutriFix logo"
            style={{ width: 260, height: 174, objectFit: "contain", filter: "drop-shadow(0 0 22px rgba(0,230,118,0.35))" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 72, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
              Autri<span style={{ color: "#00E676" }}>Fix</span>
            </span>
            <span style={{ fontSize: 28, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
              Roadside help, live on the map
            </span>
          </div>
        </div>
        <span style={{ fontSize: 22, color: "rgba(255,255,255,0.45)" }}>
          Drivers · Mechanics · Real-time jobs
        </span>
      </div>
    ),
    { ...size },
  );
}
