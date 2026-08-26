import { ImageResponse } from "next/og";
import { getProfessionalBySlug } from "@/lib/queries/search";
import { formatRating } from "@/lib/utils/format";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: { slug: string } };

export default async function Image({ params }: Props) {
  const result = await getProfessionalBySlug(params.slug);
  const professional = result?.professional;

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
        <div style={{ fontSize: 28, opacity: 0.8, display: "flex" }}>LaMainDeux</div>
        <div style={{ fontSize: 58, fontWeight: 700, marginTop: 16, display: "flex" }}>
          {professional?.company_name ?? "Professionnel vérifié"}
        </div>
        <div style={{ fontSize: 26, opacity: 0.85, marginTop: 24, display: "flex", alignItems: "center", gap: 16 }}>
          {professional?.business_city && <span style={{ display: "flex" }}>{professional.business_city}</span>}
          {professional && professional.rating_count > 0 && (
            <span style={{ display: "flex" }}>
              ★ {formatRating(professional.rating_avg)} ({professional.rating_count} avis)
            </span>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
