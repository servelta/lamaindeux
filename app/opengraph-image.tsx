import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LaMainDeux — Trouvez un artisan près de chez vous";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#1D4E5C",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", width: 64, height: 6, backgroundColor: "#B8703B", marginBottom: 32 }} />
        <div style={{ fontSize: 30, opacity: 0.8, display: "flex" }}>LaMainDeux</div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 16, display: "flex", lineHeight: 1.15 }}>
          Un artisan fiable,
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, display: "flex", lineHeight: 1.15 }}>
          près de chez vous.
        </div>
        <div style={{ fontSize: 28, opacity: 0.8, marginTop: 32, display: "flex" }}>
          Réservation en ligne gratuite — sans commission
        </div>
      </div>
    ),
    { ...size }
  );
}
