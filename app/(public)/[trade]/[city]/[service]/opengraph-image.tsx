import { ImageResponse } from "next/og";
import { getCityBySlug, getServiceBySlug, getTradeBySlugPlural } from "@/lib/queries/search";
import { pluralise } from "@/lib/utils/fr";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: { trade: string; city: string; service: string } };

export default async function Image({ params }: Props) {
  const trade = await getTradeBySlugPlural(params.trade);
  const [city, service] = await Promise.all([
    getCityBySlug(params.city),
    trade ? getServiceBySlug(params.service, trade.id) : Promise.resolve(null),
  ]);

  const heading = service && city ? `${service.name} à ${city.name}` : "Professionnel vérifié";
  const subheading = trade
    ? `${pluralise(trade.name_singular)} vérifiés · Prix affichés · Réservation en ligne`
    : "Professionnels vérifiés · Prix affichés · Réservation en ligne";

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
        <div style={{ fontSize: 58, fontWeight: 700, marginTop: 16, display: "flex", lineHeight: 1.2 }}>
          {heading}
        </div>
        <div style={{ fontSize: 26, opacity: 0.8, marginTop: 32, display: "flex" }}>
          {subheading}
        </div>
      </div>
    ),
    { ...size }
  );
}
